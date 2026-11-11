odoo.define('dtb_pos_card_payment.models', function (require) {
    var models = require('point_of_sale.models');
    var PaymentDtbCard = require('dtb_pos_card_payment.payment');

    models.register_payment_method('dtb_device_sdk', PaymentDtbCard);

    const superPaymentline = models.Paymentline.prototype;
    models.Paymentline = models.Paymentline.extend({
        initialize: function(attr, options) {
            superPaymentline.initialize.call(this,attr,options);
            this.dtbTerminalServiceId = this.dtbTerminalServiceId  || null;
            this.is_dtb_card = false;
            this.dtb_status = false;
            this.dtb_textresponse = false;
            this.dtb_auth_code = false;
            this.dtb_terminal_id = false;
            this.dtb_merchant_id = false;
            this.dtb_amount = false;
            this.dtb_card_no = false;
            this.dtb_db_ref_no = false;
            this.dtb_ref_no = false;
        },
        export_as_JSON: function(){
            const json = superPaymentline.export_as_JSON.call(this);
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
            json.dtb_ref_no = this.dtb_ref_no;
            return json;
        },
        init_from_JSON: function(json){
            superPaymentline.init_from_JSON.apply(this,arguments);
            this.dtbTerminalServiceId = json.dtb_terminal_service_id;
        },
        setTerminalServiceId: function(id) {
            this.dtbTerminalServiceId = id;
        }
    });
});
