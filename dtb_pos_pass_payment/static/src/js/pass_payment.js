odoo.define('dtb_pos_pass_payment.payment', function (require) {
"use strict";

var core = require('web.core');
var rpc = require('web.rpc');
var PaymentInterface = require('point_of_sale.PaymentInterface');
const { Gui } = require('point_of_sale.Gui');

var _t = core._t;

var PaymentPass = PaymentInterface.extend({
    send_payment_request: function (cid) {
        console.log("==send_payment_request=", cid);
        this._super.apply(this, arguments);
        return this._pass_invoice_create(cid);
    },
    send_payment_cancel: function (order, cid) {
        this._super.apply(this, arguments);
        console.log("==send_payment_cancel=", order);
        return this._pass_invoice_cancel(order);
    },
    close: function () {
        this._super.apply(this, arguments);
    },

    set_most_recent_service_id(id) {
        this.most_recent_service_id = id;
    },

    set_invoice_id(invoice_id) {
        this.invoice_id = invoice_id;
    },

    get_invoice_id() {
        return this.invoice_id;
    },

    pending_pass_line() {
      return this.pos.get_order().paymentlines.find(
        paymentLine => paymentLine.payment_method.use_payment_terminal === 'pass' && (!paymentLine.is_done()));
    },

    // ========================== CUSTOM methods ===========********************************************

    _pass_invoice_create: function (cid) {
        var self = this;
        var order = this.pos.get_order();

        if (order.selected_paymentline.amount < 0) {
            this._show_error(_t('Cannot process transactions with negative amount.'));
            return Promise.resolve();
        }

        var line = order.paymentlines.find(paymentLine => paymentLine.cid === cid);
        console.log("====_pass_invoice_create", line);
        var amount = line.amount;
        line.set_payment_status('waiting');
        rpc.query({
            model: 'pass.integration',
            method: 'create_invoice',
            args: [ order.name, order.pos.config['id'], amount, self.pos.pos_session.id],
        }).then(function(result){
            if (result) {
                if(result['status'] === 'ok'){
                    self.set_invoice_id(result['invoice_id']);
                    line.transaction_id = result['invoice_id'];
                    line.qr_data = result['qr_data'];
                    var body = {
                        'invoice_id': result['invoice_id'],
                        'qr_data': "data:image/png;base64," + result['qr_data'],
                        'line': line,
                    };
                    // Open QR Popup
                    const { confirmed, payload } = Gui.showPopup('PassQrPopup', {
                        title: _t('Scan QR'),
                        startingValue: 0,
                        body: body,
                    });
                } else {
                    self._show_error(_.str.sprintf(_t('Message from PASS: %s, (%s)'), result['body'], result['code']));
                }
            }
        });
    },

    _pass_invoice_cancel: function (order) {
        var self = this;
        var line = self.pending_pass_line()
        var invoice_id = self.get_invoice_id();
        console.log("=invoice_id", invoice_id, line);

        line.set_payment_status('retry');
        line.transaction_id = false;
        self.set_invoice_id(null);
    },

    // *************************************************************************************************
    
    _show_error: function (msg, title) {
        if (!title) {
            title =  _t('PASS Error');
        }
        Gui.showPopup('ErrorPopup',{
            'title': title,
            'body': msg,
        });
    },
});

return PaymentPass;
});
