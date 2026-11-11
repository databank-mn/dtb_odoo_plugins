/** @odoo-module */

import { PaymentGoConn } from "@dtb_pos_go_conn_payment/app/payment_goconn";
import { register_payment_method } from "@point_of_sale/app/store/pos_store";

// Бүртгэж байна
register_payment_method("dtb_go_conn", PaymentGoConn);

import { Payment } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";

// Payment model-ийг patch хийж өргөтгөнө
patch(Payment.prototype, {
    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        this.terminalServiceId = json.terminal_service_id;
        if(json && this.payment_method?.use_payment_terminal === 'dtb_go_conn'){
            this.go_conn_amount = false;
            this.is_go_conn = false;
            this.go_conn_db_ref_no = false;
            this.go_conn_textresponse = false;
            this.go_conn_resp_code = false;
            this.go_conn_aid = false;
            this.go_conn_pan = false;
            this.go_conn_model = false;
            this.go_conn_rrn = false;
            this.go_conn_trace_no = false;
            this.go_conn_terminal_id = false;
        }
    },
    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        if(json && this.payment_method?.use_payment_terminal === 'dtb_go_conn'){
            json.terminal_service_id = this.terminalServiceId;
            json.is_go_conn = this.is_go_conn;
            json.go_conn_amount = this.go_conn_amount;
            json.go_conn_db_ref_no = this.go_conn_db_ref_no;
            json.go_conn_textresponse = this.go_conn_textresponse;
            json.go_conn_resp_code = this.go_conn_resp_code;
            json.go_conn_aid = this.go_conn_aid;
            json.go_conn_pan = this.go_conn_pan;
            json.go_conn_model = this.go_conn_model;
            json.go_conn_rrn = this.go_conn_rrn;
            json.go_conn_trace_no = this.go_conn_trace_no;
            json.go_conn_terminal_id = this.go_conn_terminal_id;
        }
        return json;
    },
});