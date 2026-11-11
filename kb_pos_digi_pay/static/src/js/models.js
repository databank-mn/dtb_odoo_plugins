odoo.define('kb_pos_digi_pay.models', function (require) {
    var models = require('point_of_sale.models');
    var PaymentDigiPay = require('kb_pos_digi_pay.payment');
    var _super_paymentline = models.Paymentline.prototype;

    models.register_payment_method('digi_pay', PaymentDigiPay);
    models.load_fields('pos.payment.method', 'digi_pay_identifier');

    models.Paymentline = models.Paymentline.extend({    
        initialize: function() {
            _super_paymentline.initialize.apply(this, arguments);
            this.digipay_status = false;
            this.is_digipay = false;
            this.digipay_db_ref_no = false;
            this.digipay_textresponse = false;
            this.digipay_resp_code = false;
            this.digipay_terminal_id = false;
            this.digipay_approval_code = false;
            this.digipay_payment_request_id = false;
            this.digipay_rrn = false;
        },
        export_as_JSON: function() {
            var json = _super_paymentline.export_as_JSON.apply(this, arguments);
            json.is_digipay = this.is_digipay;
            json.digipay_status = this.digipay_status;
            json.digipay_db_ref_no = this.digipay_db_ref_no;
            json.digipay_textresponse = this.digipay_textresponse;
            json.digipay_resp_code = this.digipay_resp_code;
            json.digipay_terminal_id = this.digipay_terminal_id;
            json.digipay_approval_code = this.digipay_approval_code;
            json.digipay_payment_request_id = this.digipay_payment_request_id;
            json.digipay_rrn = this.digipay_rrn;
            return json;
        },
    });
});
