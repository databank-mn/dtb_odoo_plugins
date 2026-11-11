// POS session хаахын өмнө goconnection-ий `doSettlement`-ээр терминалын batch-ыг хаана (16.0).
// `closeSession` нь Odoo-гийн хаах RPC-үүдээс өмнө дуудагддаг, тиймээс тооцоо амжилтгүй бол
// session нээлттэй үлдэнэ (эсвэл кассир ухамсартайгаар хаана).
odoo.define('dtb_pos_go_conn_payment.ClosePosPopupGoConn', function (require) {
    'use strict';

    const ClosePosPopup = require('point_of_sale.ClosePosPopup');
    const Registries = require('point_of_sale.Registries');
    const utils = require('dtb_pos_go_conn_payment.go_conn_utils');
    const client = require('dtb_pos_go_conn_payment.go_conn_client');

    const GoConnClosePosPopup = (Base) =>
        class extends Base {
            async closeSession() {
                // confirm() нь closeSession-ийг await хийдэггүй тул давхар товшилтоос өөрсдөө хамгаална.
                if (this._goConnBusy) {
                    return;
                }
                this._goConnBusy = true;
                let proceed = true;
                try {
                    proceed = await this._goConnSettleBeforeClose();
                } catch (error) {
                    // Тооцооны алхам санамсаргүй унавал кассирыг гацаахгүй, Odoo-гийн хаалт үргэлжилнэ.
                    console.error('Go conn: settlement step failed', error);
                } finally {
                    this._goConnBusy = false;
                }
                if (!proceed) {
                    return;
                }
                return super.closeSession(...arguments);
            }

            // 16.0: pos_session.payment_method_ids нь id-ийн жагсаалт, бүртгэлийг payment_methods_by_id-аас авна.
            _goConnPaymentMethods() {
                const pos = this.env.pos;
                const ids =
                    (pos.pos_session && pos.pos_session.payment_method_ids) ||
                    (pos.config && pos.config.payment_method_ids);
                if (!ids) {
                    console.warn('Go conn: payment methods of the session are unavailable');
                    return [];
                }
                const byId = pos.payment_methods_by_id || {};
                return Array.from(ids)
                    .map((id) => (typeof id === 'object' ? id : byId[id]))
                    .filter(Boolean);
            }

            async _goConnSettleBeforeClose() {
                // _goConnSettled: хаалт алдаатай болж дахин дарахад settlement давхар явахаас сэргийлнэ.
                if (this._goConnSettled || !utils.needsGoConnSettlement(this._goConnPaymentMethods())) {
                    return true;
                }
                const session = this.env.pos.pos_session;
                const headers = await client.getGoConnHeaders();
                client.lockUi(this.env._t('Тооцоо хааж байна, түр хүлээнэ үү!'));
                let result;
                try {
                    result = await utils.doSettlement(headers, utils.formatDbRefNo(session));
                } finally {
                    client.unlockUi();
                }

                if (result.ok) {
                    this._goConnSettled = true;
                    await this._goConnSaveSettlement({
                        description: result.msg,
                        sale_count: result.saleCount,
                        sale_total: result.saleTotal,
                        void_count: result.voidCount,
                        void_total: result.voidTotal,
                    });
                    return true;
                }

                const { confirmed } = await this.showPopup('ConfirmPopup', {
                    title: this.env._t('Тооцоо хаагдсангүй'),
                    body:
                        utils.describeFailure(result) +
                        '\n\n' +
                        this.env._t('Тооцоо хаагдаагүй байна. Session-ийг ямартай ч хаах уу?'),
                    confirmText: this.env._t('Ямартай ч хаах'),
                    cancelText: this.env._t('Цуцлах'),
                });
                if (confirmed) {
                    await this._goConnSaveSettlement({ description: utils.describeFailure(result) });
                }
                return confirmed;
            }

            // Тооцооны үр дүнг сервер дээр хадгална. Хадгалж чадаагүй ч session хаахыг блоклохгүй.
            async _goConnSaveSettlement(vals) {
                try {
                    await this.rpc({
                        model: 'pos.session',
                        method: 'go_conn_save_settlement',
                        args: [this.env.pos.pos_session.id, vals],
                    });
                } catch (error) {
                    console.warn('Go conn: settlement result was not saved on the server', error, vals);
                }
            }
        };

    Registries.Component.extend(ClosePosPopup, GoConnClosePosPopup);

    return ClosePosPopup;
});
