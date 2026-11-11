import { _t } from "@web/core/l10n/translation";
import { PaymentInterface } from "@point_of_sale/app/utils/payment/payment_interface";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { register_payment_method } from "@point_of_sale/app/services/pos_store";
import { GO_CONN_URL, formatDbRefNo } from "@dtb_pos_go_conn_payment/app/go_conn_utils";
import { getGoConnHeaders, lockUi, unlockUi } from "@dtb_pos_go_conn_payment/app/go_conn_client";

export class PaymentGoConn extends PaymentInterface {
    setup() {
        super.setup(...arguments);
        this.most_recent_service_id = null;
    }

    sendPaymentRequest(uuid) {
        super.sendPaymentRequest(uuid);
        return this._goConnTxnCreate(uuid);
    }

    sendPaymentCancel(order, uuid) {
        super.sendPaymentCancel(order, uuid);
        return this._goConnTxnCancel(order, uuid);
    }

    close() {
        super.close();
    }

    pendingGoConnLine() {
        return this.pos.getPendingPaymentLine("dtb_go_conn");
    }

    async _goConnTxnCreate(uuid) {
        const order = this.pos.getOrder();
        const line = order.payment_ids.find((paymentLine) => paymentLine.uuid === uuid);
        if (!line) {
            this._show_error(_t("Payment line not found."));
            return false;
        }
        if (line.amount < 0) {
            this._show_error(_t("Cannot process transactions with negative amount."));
            return false;
        }

        line.setPaymentStatus("waitingCard");
        const headers = await getGoConnHeaders();
        lockUi(_t("Карт унштал түр хүлээнэ үү!"));

        const session = order.session_id || this.pos.session;
        const body = {
            service_name: "doSaleTransaction",
            service_params: {
                db_ref_no: formatDbRefNo(session),
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

    _goConnTxnCancel(order, uuid) {
        const line =
            order?.payment_ids?.find((paymentLine) => paymentLine.uuid === uuid) ||
            this.pendingGoConnLine();
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
        this.env.services.dialog.add(AlertDialog, {
            title: title,
            body: msg,
        });
    }
}

register_payment_method("dtb_go_conn", PaymentGoConn);
