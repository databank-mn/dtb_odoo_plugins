odoo.define('dtb_pos_pass_payment.models', function (require) {
    var models = require('point_of_sale.models');
    var PaymentPass = require('dtb_pos_pass_payment.payment');

    models.register_payment_method('pass', PaymentPass);
    models.load_fields('pos.payment.method', 'pass_payment_identifier');

    const superPaymentline = models.Paymentline.prototype;
    models.Paymentline = models.Paymentline.extend({
        initialize: function(attr, options) {
            superPaymentline.initialize.call(this,attr,options);
            this.terminalServiceId = this.terminalServiceId  || null;
            this.pass_status = false;
            this.is_pass = false;
            this.pass_db_ref_no = false;
            this.pass_textresponse = false;
            this.pass_resp_code = false;
            this.pass_terminal_id = false;
            this.pass_approval_code = false;
            this.pass_payment_request_id = false;
            this.pass_rrn = false;
        },
        export_as_JSON: function(){
            const json = superPaymentline.export_as_JSON.call(this);
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
        },
        init_from_JSON: function(json){
            superPaymentline.init_from_JSON.apply(this,arguments);
            this.terminalServiceId = json.terminal_service_id;
        },
        setTerminalServiceId: function(id) {
            this.terminalServiceId = id;
        }
    });
});
