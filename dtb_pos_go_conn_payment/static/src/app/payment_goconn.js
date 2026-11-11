/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { PaymentInterface } from "@point_of_sale/app/payment/payment_interface";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { jsonrpc } from "@web/core/network/rpc_service";

export class PaymentGoConn extends PaymentInterface {

    setup() {
        super.setup(...arguments);
        this.most_recent_service_id = null;
    }

    async send_payment_request(cid) {
        console.log("==DTB send_payment_request=", cid);
        await super.send_payment_request(cid);
        return this._go_conn_txn_create(cid);
    }

    async send_payment_cancel(order, cid) {
        await super.send_payment_cancel(order, cid);
        // console.log("==send_payment_cancel=", order);
        return this._go_conn_txn_cancel(order);
    }

    close() {
        super.close();
    }

    set_most_recent_service_id(id) {
        this.most_recent_service_id = id;
    }

    pending_go_conn_line() {
        return this.pos.get_order().paymentlines.find(
            (paymentLine) => paymentLine.payment_method.use_payment_terminal === 'dtb_go_conn' && !paymentLine.is_done()
        );
    }

    async _get_version() {
        return await jsonrpc("/web/dataset/call_kw/ir.module.module/get_module_full_version", {
            model: 'ir.module.module',
            method: 'get_module_full_version',
            args: ['dtb_pos_go_conn_payment'],
            kwargs: {},
        });
    }

    async _go_conn_txn_create(cid) {
        const order = this.pos.get_order();
        if (order.selected_paymentline.amount < 0) {
            this._show_error(_t('Cannot process transactions with negative amount.'));
            return false;
        }

        const line = order.paymentlines.find(paymentLine => paymentLine.cid === cid);
        line.set_payment_status('waitingCard');
        const version = await this._get_version();

        this.uiLock();

        const headers = {
            "content-type": "application/json",
            "msp_program_name": "Odoo ERP, dtb_pos_go_conn_payment: " + version,
            "Access-Control-Allow-Origin": "*",
        };

        const db_ref_no = this.pos.pos_session.start_at.substring(0, 10).replaceAll('-', '') + this.pos.pos_session.id;
        const body = {
            "service_name": "doSaleTransaction",
            "service_params": {
                "db_ref_no": db_ref_no,
                "amount": line.amount.toFixed(2),
            }
        };

        try {
            const response = await $.ajax({
                url: "http://localhost:27028",
                method: "POST",
                headers: headers,
                data: JSON.stringify(body),
            });

            if (response.status === true) {
                if (response.response.response_code === "000") {
                    line.set_payment_status('done');
                    const ret = response.response;
                    line.is_go_conn = true;
                    line.go_conn_amount = ret['amount'];
                    line.go_conn_db_ref_no = ret['db_ref_no'];
                    line.go_conn_textresponse = JSON.stringify(ret);
                    line.go_conn_resp_code = ret['response_code'];
                    line.go_conn_aid = ret['aid'];
                    line.go_conn_pan = ret['pan'];
                    line.go_conn_model = ret['model'];
                    line.go_conn_rrn = ret['rrn'];
                    line.go_conn_trace_no = ret['trace_no'];
                    line.go_conn_terminal_id = ret['terminal_id'];
                    this.uiUnLock();
                    return true;
                } else {
                    this.uiUnLock();
                    this._show_error(_t(`Код: ${response.response.response_code}, ${response.response.response_msg}`));
                    return false;
                }
            } else if (response.status_code === 'ng') {
                this.uiUnLock();
                this._show_error(_t(`Код: ${response.msg.code}, ${response.msg.body}`));
                return false;
            } else {
                this.uiUnLock();
                this._show_error(_t(`Код: ${response.response.Exception.ErrorCode}, ${response.response.Exception.ErrorMessage}`));
                return false;
            }
        } catch (error) {
            console.error("=error===", error);
            line.set_payment_status('retry');
            line.transaction_id = false;
            this.uiUnLock();
            this._show_error(_t(`Код: ${error.status}, ${error.statusText}`));
            return false;
        }
        return false;
    }

    _go_conn_txn_cancel(order) {
        const line = this.pending_go_conn_line();
        line.set_payment_status('retry');
        line.transaction_id = false;
        return true;
    }

    uiLock() {
        $('body').off('keypress', this.keyboard_handler);
        $('<div></div>').attr('id', 'uiLockId').css({
            'position': 'absolute',
            'top': 0,
            'left': 0,
            'z-index': 1000,
            'opacity': 0.6,
            'width': '100%',
            'height': '100%',
            'color': 'white',
            'background-color': 'black'
        }).appendTo('body');

        $('<div></div>').attr('id', 'countdown_div').css({
            'position': 'absolute',
            'top': '35%',
            'left': '30%',
            'width': '570px',
            'border': '3px solid #33b5e5',
            'padding': '10px',
            'color': 'white',
            'font-family': 'tahoma',
            'font-weight': 'bold',
            'font-size': '25px',
            'z-index': 5000,
            'opacity': 0.8,
            'background-color': 'black'
        }).html('Карт унштал түр хүлээнэ үү!').appendTo('body');
    }

    uiUnLock() {
        $('div#uiLockId').remove();
        $('div#countdown_div').remove();
        $('body').keypress(this.keyboard_handler);
    }

    _show_error(msg, title) {
        if (!title) {
            title = _t('Go conn Error');
        }
        this.env.services.popup.add(ErrorPopup, {
            title: title,
            body: msg,
        });
    }
}