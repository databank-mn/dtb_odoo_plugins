odoo.define('dtb_pos_card_payment.models', function (require) {
    const { register_payment_method, Payment } = require('point_of_sale.models');
    const PaymentDtbCard = require('dtb_pos_card_payment.payment');
    const Registries = require('point_of_sale.Registries');
    
    register_payment_method('dtb_device_sdk', PaymentDtbCard);

    const PosCardPayment = (Payment) => class PosCardPayment extends Payment {
        constructor(obj, options) {
            super(...arguments);
            this.dtbTerminalServiceId = this.dtbTerminalServiceId || null;
            this.is_dtb_card = false;
            this.dtb_status = false;
            this.dtb_textresponse = false;
            this.dtb_auth_code = false;
            this.dtb_terminal_id = false;
            this.dtb_merchant_id = false;
            this.dtb_amount = false;
            this.dtb_card_no = false;
            this.dtb_db_ref_no = false;
            this.dtb_trace_no = false;
            this.dtb_ref_no = false;
        }
        //@override
        export_as_JSON() {
            const json = super.export_as_JSON(...arguments);
            json.dtb_terminal_service_id = this.dtbTerminalServiceId;
            json.is_dtb_card = this.is_dtb_card;
            json.dtb_status = this.dtb_status;
            json.dtb_textresponse = this.dtb_textresponse;
            json.dtb_auth_code = this.dtb_auth_code;
            json.dtb_terminal_id = this.dtb_terminal_id;
            json.dtb_merchant_id = this.dtb_merchant_id;
            json.dtb_amount = this.dtb_amount;
            json.dtb_card_no = this.dtb_card_no;
            json.dtb_db_ref_no = this.dtb_db_ref_no;
            json.dtb_trace_no = this.dtb_trace_no;
            json.dtb_ref_no = this.dtb_ref_no;
            return json;
        }
        //@override
        init_from_JSON(json) {
            super.init_from_JSON(...arguments);
            this.dtbTerminalServiceId = json.dtb_terminal_service_id;
        }
        setTerminalServiceId(id) {
            this.dtbTerminalServiceId = id;
        }
    }
    Registries.Model.extend(Payment, PosCardPayment);
});
