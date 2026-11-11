odoo.define('kb_pos_digi_pay.payment', function (require) {
"use strict";

var core = require('web.core');
var rpc = require('web.rpc');
var PaymentInterface = require('point_of_sale.PaymentInterface');
var delay = require("web.concurrency").delay;

var _t = core._t;

var PaymentDigiPay = PaymentInterface.extend({
    send_payment_request: function (cid) {
        console.log("==send_payment_request=", cid);
        this._super.apply(this, arguments);
        return this._digipay_invoice_create(cid);
    },
    send_payment_cancel: function (order, cid) {
        this._super.apply(this, arguments);
        console.log("==send_payment_cancel=", order);
        return this._digipay_invoice_cancel(order);
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

    pending_digipay_line() {
      return this.pos.get_order().paymentlines.find(
        paymentLine => paymentLine.payment_method.use_payment_terminal === 'digi_pay' && (paymentLine.get_payment_status() != 'done'));
    },

    // ========================== CUSTOM methods ===========********************************************

    _digipay_invoice_create: async function (cid) {
        var self = this;
        var order = this.pos.get_order();

        if (order.selected_paymentline.amount < 0) {
            this._show_error(_t('Cannot process transactions with negative amount.'));
            return Promise.resolve();
        }

        var line = order.paymentlines.find(paymentLine => paymentLine.cid === cid);
        console.log("====_digipay_invoice_create", line);
        var amount = line.amount;
        line.set_payment_status('waitingCard');
        self.pos.chrome.gui.current_screen.render_paymentlines();
        rpc.query({
            model: 'digi.pay.integration',
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
                    self.checkInv();
                    self.pos.gui.show_popup('DigiPayQrPopup', {
                        'title': _t('Scan QR'),
                        'body': body,
                        'qr_data': "data:image/png;base64," + result['qr_data'],
                        'line': line,
                        confirm: function(){
                            self.checkInv();
                        },
                        cancel: function(){
                            self.cancelInv();
                        },
                    });

                } else {
                    self._show_error(_.str.sprintf(_t('Message from DigiPay: %s, (%s)'), result['body'], result['code']));
                    return Promise.resolve();
                }
            }
        });
    },

    _digipay_invoice_cancel: function (order) {
        var self = this;
        var line = self.pending_digipay_line();
        var invoice_id = self.get_invoice_id();
        console.log("=invoice_id", invoice_id, line);

        line.set_payment_status('retry');
        self.pos.chrome.gui.current_screen.render_paymentlines();
        line.transaction_id = false;
        self.set_invoice_id(null);
    },

    cancelInv: function(){
        console.log("===cancelInv clicked!", invoice_id);
        var self = this;
        var invoice_id = self.get_invoice_id();
        var self = this;
        if (invoice_id) {
            rpc.query({
                model: 'digi.pay.integration',
                method: 'cancel_invoice',
                args: [self.pos.get_order().pos.config['id'], invoice_id],
            }).then(function(result){
                self._digipay_invoice_cancel(self.pos.get_order());
            });
        }
    },

    checkInv: function() {
        var self = this;
        var invoice_id = self.get_invoice_id();
        console.log("===checkInv clicked!", invoice_id);
        if (invoice_id) {
            rpc.query({
                model: 'digi.pay.integration',
                method: 'check_invoice',
                args: [self.pos.get_order().pos.config['id'], invoice_id],
            }).then(function(result){
                console.log('check result', result);
                if (result['status'] == 'paid') {
                    $(".class_inv_response_paid").text(result['msg']);
                    $(".class_inv_response_paid").show();
                    $(".class_inv_response_unpaid").text('');
                    $(".class_inv_response_unpaid").hide();
                    // To paid
                    var line = self.pending_digipay_line();
                    if(line){
                        line.set_payment_status('done');
                        self.pos.chrome.gui.current_screen.render_paymentlines();
                        // Save data
                        var ret = result['ret'];
                        line.is_digipay = true;
                        line.digipay_status = result['status'];
                        line.digipay_db_ref_no = ret['db_ref_no'];
                        line.digipay_textresponse = JSON.stringify(ret);;
                        line.digipay_resp_code = ret['resp_code'];
                        line.digipay_terminal_id = ret['extra_data']['terminal_id'];
                        line.digipay_approval_code = ret['extra_data']['approval_code'];
                        line.digipay_payment_request_id = ret['extra_data']['payment_request_id'];
                        line.digipay_rrn = ret['extra_data']['rrn'];
                        console.log("======paid==line", line);
                    }
                    delay(500).then(function() {
                        self.pos.gui.close_popup();
                    });
                } else if (result['status'] == 'pending') {
                    $(".class_inv_response_unpaid").text(result['msg']);
                    $(".class_inv_response_unpaid").show();
                    $(".class_inv_response_paid").text('');
                    $(".class_inv_response_paid").hide();
                    return delay(1500)
                        .then(function() {
                            self.checkInv();
                        });
                } else if (result['status'] == 'expired') {
                    console.log("=expired==", result['status']);
                    self.pos.gui.close_popup();
                    return;
                }
                else {
                    console.log("=???????==", result['status']);
                    return;
                }
            });
        }
    },

    // *************************************************************************************************
    
    _show_error: function (msg, title) {
        if (!title) {
            title =  _t('DigiPay Error');
        }
        this.pos.gui.show_popup('error',{
            'title': title,
            'body': msg,
        });
    },
});

return PaymentDigiPay;
});
