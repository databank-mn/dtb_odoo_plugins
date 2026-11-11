odoo.define('dtb_pos_pass_payment.models', function (require) {
    const { register_payment_method, Payment } = require('point_of_sale.models');
    const PaymentPass = require('dtb_pos_pass_payment.payment');
    const Registries = require('point_of_sale.Registries');

    register_payment_method('pass', PaymentPass);

    const PosPassPayment = (Payment) => class PosPassPayment extends Payment {
        constructor(obj, options) {
            super(...arguments);
            this.terminalServiceId = this.terminalServiceId || null;
            this.pass_status = false;
            this.is_pass = false;
            this.pass_db_ref_no = false;
            this.pass_textresponse = false;
            this.pass_resp_code = false;
            this.pass_terminal_id = false;
            this.pass_approval_code = false;
            this.pass_payment_request_id = false;
            this.pass_rrn = false;
        }
        //@override
        export_as_JSON() {
            const json = super.export_as_JSON(...arguments);
            json.terminal_service_id = this.terminalServiceId;
            json.is_pass = this.is_pass;
            json.pass_status = this.pass_status;
            json.pass_db_ref_no = this.pass_db_ref_no;
            json.pass_textresponse = this.pass_textresponse;
            json.pass_resp_code = this.pass_resp_code;
            json.pass_terminal_id = this.pass_terminal_id;
            json.pass_approval_code = this.pass_approval_code;
            json.pass_payment_request_id = this.pass_payment_request_id;
            json.pass_rrn = this.pass_rrn;
            return json;
        }
        //@override
        init_from_JSON(json) {
            super.init_from_JSON(...arguments);
            this.terminalServiceId = json.terminal_service_id;
        }
        setTerminalServiceId(id) {
            this.terminalServiceId = id;
        }
    }
    Registries.Model.extend(Payment, PosPassPayment);
});
