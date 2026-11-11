odoo.define('dtb_pos_go_conn_payment.models', function (require) {
    var models = require('point_of_sale.models');
    var PaymentGoConn = require('dtb_pos_go_conn_payment.payment');
    var _super_paymentline = models.Paymentline.prototype;

    models.register_payment_method('dtb_go_conn', PaymentGoConn);
    models.load_fields('pos.payment.method', 'dtb_go_conn_payment_identifier');

    models.Paymentline = models.Paymentline.extend({    
        initialize: function() {
            _super_paymentline.initialize.apply(this, arguments);
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
        },
        export_as_JSON: function() {
            var json = _super_paymentline.export_as_JSON.apply(this, arguments);
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
            return json;
        },
    });
});
