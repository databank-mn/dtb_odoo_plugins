import { ClosePosPopup } from "@point_of_sale/app/components/popups/closing_popup/closing_popup";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import {
    describeFailure,
    doSettlement,
    formatDbRefNo,
    needsGoConnSettlement,
} from "@dtb_pos_go_conn_payment/app/go_conn_utils";
import { getGoConnHeaders, lockUi, unlockUi } from "@dtb_pos_go_conn_payment/app/go_conn_client";

// POS session хаахын өмнө goconnection-ий `doSettlement`-ээр терминалын batch-ыг хаана.
// `closeSession` нь Odoo-гийн хаах RPC-үүдээс өмнө дуудагддаг, тиймээс тооцоо
// амжилтгүй бол session нээлттэй үлдэнэ (эсвэл кассир ухамсартайгаар хаана).
patch(ClosePosPopup.prototype, {
    async closeSession() {
        let proceed = true;
        try {
            proceed = await this.goConnSettleBeforeClose();
        } catch (error) {
            // Тооцооны алхам санамсаргүй унавал кассирыг гацаахгүй: Odoo-гийн хаалт хэвээр үргэлжилнэ.
            console.error("Go conn: settlement step failed, continuing with the normal close", error);
            unlockUi();
        }
        if (!proceed) {
            return;
        }
        return super.closeSession(...arguments);
    },

    goConnUsesTerminal() {
        const methods = this.pos.session?.payment_method_ids ?? this.pos.config?.payment_method_ids;
        if (!methods) {
            console.warn("Go conn: payment methods of the session are unavailable");
            return false;
        }
        return needsGoConnSettlement(Array.from(methods));
    },

    async goConnSettleBeforeClose() {
        // goConnSettled: хаалт алдаатай болж дахин дарахад settlement давхар явахаас сэргийлнэ.
        if (this.goConnSettled || !this.goConnUsesTerminal()) {
            return true;
        }
        const headers = await getGoConnHeaders();
        lockUi(_t("Тооцоо хааж байна, түр хүлээнэ үү!"));
        let result;
        try {
            result = await doSettlement(headers, formatDbRefNo(this.pos.session));
        } finally {
            unlockUi();
        }

        if (result.ok) {
            this.goConnSettled = true;
            await this.goConnSaveSettlement({
                description: result.msg,
                sale_count: result.saleCount,
                sale_total: result.saleTotal,
                void_count: result.voidCount,
                void_total: result.voidTotal,
            });
            return true;
        }

        const closeAnyway = await this.goConnAskCloseAnyway(result);
        if (closeAnyway) {
            await this.goConnSaveSettlement({ description: describeFailure(result) });
        }
        return closeAnyway;
    },

    goConnAskCloseAnyway(result) {
        return new Promise((resolve) => {
            let answered = false;
            const answer = (value) => {
                if (!answered) {
                    answered = true;
                    resolve(value);
                }
            };
            this.dialog.add(
                ConfirmationDialog,
                {
                    title: _t("Тооцоо хаагдсангүй"),
                    body:
                        describeFailure(result) +
                        "\n\n" +
                        _t("Тооцоо хаагдаагүй байна. Session-ийг ямартай ч хаах уу?"),
                    confirmLabel: _t("Ямартай ч хаах"),
                    cancelLabel: _t("Цуцлах"),
                    confirm: () => answer(true),
                    cancel: () => answer(false),
                },
                { onClose: () => answer(false) }
            );
        });
    },

    // Тооцооны үр дүнг сервер дээр хадгална. Хадгалж чадаагүй ч session хаахыг блоклохгүй.
    async goConnSaveSettlement(vals) {
        const saved = await this.pos.data.silentCall("pos.session", "go_conn_save_settlement", [
            this.pos.session.id,
            vals,
        ]);
        if (saved === false) {
            console.warn("Go conn: settlement result was not saved on the server", vals);
        }
    },
});
