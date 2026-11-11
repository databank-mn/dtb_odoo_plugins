import { _t } from "@web/core/l10n/translation";
import { PaymentInterface } from "@point_of_sale/app/utils/payment/payment_interface";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { registry } from "@web/core/registry";
import { GO_CONN_URL, formatDbRefNo } from "@dtb_pos_go_conn_payment/app/go_conn_utils";
import { getGoConnHeaders, lockUi, unlockUi } from "@dtb_pos_go_conn_payment/app/go_conn_client";

// Odoo 20: төлбөрийн интерфэйс нь `registry.category("pos_payment_providers")`-д бүртгэгдэнэ
// (өмнөх `register_payment_method` байхгүй болсон) ба `sendPaymentRequest(line)` нь
// төлбөрийн мөрийг (uuid биш) шууд авна.
export class PaymentGoConn extends PaymentInterface {
    async sendPaymentRequest(line) {
        await super.sendPaymentRequest(...arguments);
        return this._goConnTxnCreate(line);
    }

    async sendPaymentCancel(line) {
        await super.sendPaymentCancel(...arguments);
        return this._goConnTxnCancel(line);
    }

    async _goConnTxnCreate(line) {
        if (line.amount < 0) {
            this._show_error(_t("Cannot process transactions with negative amount."));
            return false;
        }

        line.setPaymentStatus("waitingCard");
        const headers = await getGoConnHeaders(this.pos);
        lockUi(_t("Карт унштал түр хүлээнэ үү!"));

        const body = {
            service_name: "doSaleTransaction",
            service_params: {
                db_ref_no: formatDbRefNo(this.pos.session),
                amount: line.amount.toFixed(2),
            },
        };

        let outcome;
        try {
            const response = await fetch(GO_CONN_URL, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseData = await response.json();
            if (responseData.status === true) {
                if (responseData.response.response_code === "000") {
                    outcome = { ok: true, ret: responseData.response };
                } else {
                    outcome = {
                        ok: false,
                        message: `Код: ${responseData.response.response_code}, ${responseData.response.response_msg}`,
                    };
                }
            } else if (responseData.status_code === "ng") {
                outcome = {
                    ok: false,
                    message: `Код: ${responseData.msg.code}, ${responseData.msg.body}`,
                };
            } else {
                outcome = {
                    ok: false,
                    message: `Код: ${responseData.response.Exception.ErrorCode}, ${responseData.response.Exception.ErrorMessage}`,
                };
            }
        } catch (error) {
            console.error("=error===", error);
            outcome = { ok: false, retry: true, message: `Алдаа: ${error.message}` };
        } finally {
            unlockUi();
        }

        if (outcome.ok) {
            const ret = outcome.ret;
            line.setPaymentStatus("done");
            line.is_go_conn = true;
            line.go_conn_amount = ret["amount"];
            line.go_conn_db_ref_no = ret["db_ref_no"];
            line.go_conn_textresponse = JSON.stringify(ret);
            line.go_conn_resp_code = ret["response_code"];
            line.go_conn_aid = ret["aid"];
            line.go_conn_pan = ret["pan"];
            line.go_conn_model = ret["model"];
            line.go_conn_rrn = ret["rrn"];
            line.go_conn_trace_no = ret["trace_no"];
            line.go_conn_terminal_id = ret["terminal_id"];
            return true;
        }
        if (outcome.retry) {
            line.setPaymentStatus("retry");
            line.transaction_id = false;
        }
        this._show_error(outcome.message);
        return false;
    }

    _goConnTxnCancel(line) {
        if (line) {
            line.setPaymentStatus("retry");
            line.transaction_id = false;
        }
        return true;
    }

    _show_error(msg, title) {
        if (!title) {
            title = _t("Go conn Error");
        }
        this.dialog.add(AlertDialog, {
            title: title,
            body: msg,
        });
    }
}

registry.category("pos_payment_providers").add("dtb_go_conn", PaymentGoConn);
