/** @odoo-module **/

import { ClosePosPopup } from "@point_of_sale/app/navbar/closing_popup/closing_popup";
import { ConfirmPopup } from "@point_of_sale/app/utils/confirm_popup/confirm_popup";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
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

    // 17.0: pos_session.payment_method_ids нь id-ийн жагсаалт, бүртгэлийг payment_methods_by_id-аас авна.
    goConnPaymentMethods() {
        const ids = this.pos.pos_session?.payment_method_ids ?? this.pos.config?.payment_method_ids;
        if (!ids) {
            console.warn("Go conn: payment methods of the session are unavailable");
            return [];
        }
        const byId = this.pos.payment_methods_by_id || {};
        return Array.from(ids)
            .map((id) => (typeof id === "object" ? id : byId[id]))
            .filter(Boolean);
    },

    async goConnSettleBeforeClose() {
        // goConnSettled: хаалт алдаатай болж дахин дарахад settlement давхар явахаас сэргийлнэ.
        if (this.goConnSettled || !needsGoConnSettlement(this.goConnPaymentMethods())) {
            return true;
        }
        const headers = await getGoConnHeaders();
        lockUi(_t("Тооцоо хааж байна, түр хүлээнэ үү!"));
        let result;
        try {
            result = await doSettlement(headers, formatDbRefNo(this.pos.pos_session));
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

        const { confirmed } = await this.popup.add(ConfirmPopup, {
            title: _t("Тооцоо хаагдсангүй"),
            body:
                describeFailure(result) +
                "\n\n" +
                _t("Тооцоо хаагдаагүй байна. Session-ийг ямартай ч хаах уу?"),
            confirmText: _t("Ямартай ч хаах"),
            cancelText: _t("Цуцлах"),
        });
        if (confirmed) {
            await this.goConnSaveSettlement({ description: describeFailure(result) });
        }
        return confirmed;
    },

    // Тооцооны үр дүнг сервер дээр хадгална. Хадгалж чадаагүй ч session хаахыг блоклохгүй.
    async goConnSaveSettlement(vals) {
        try {
            await this.orm.silent.call("pos.session", "go_conn_save_settlement", [
                this.pos.pos_session.id,
                vals,
            ]);
        } catch (error) {
            console.warn("Go conn: settlement result was not saved on the server", error, vals);
        }
    },
});
