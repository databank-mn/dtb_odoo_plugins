odoo.define('dtb_pos_pass_payment.PassQrPopup', function(require) {
    'use strict';
    const { useState } = owl;
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    // const { useListener } = require('web.custom_hooks');
    const { useListener } = require("@web/core/utils/hooks");
    const Registries = require('point_of_sale.Registries');
    var rpc = require('web.rpc');
    var delay = require("web.concurrency").delay;
    var models = require('point_of_sale.models');

    class PassQrPopup extends AbstractAwaitablePopup {
        /**
         * @param {Object} props
         * @param {Boolean} props.isPassword Show password popup.
         * @param {number|null} props.startingValue Starting value of the popup.
         *
         * Resolve to { confirmed, payload } when used with showPopup method.
         * @confirmed {Boolean}
         * @payload {String}
         */
        constructor() {
            super(...arguments);
            var self = this;
            delay(5000).then(function() {
                self.checkInv();
            });
        }

        async checkInv() {
            var invoice_id = this.props.body['invoice_id'];
            console.log("===checkInv clicked!", invoice_id);
            var self = this;
            if (invoice_id) {
                rpc.query({
                    model: 'pass.integration',
                    method: 'check_invoice',
                    args: [this.env.pos.get_order().pos.config['id'], invoice_id],
                }).then(function(result){
                    console.log('create result', result);
                    if (result['status'] == 'paid') {
                        $(".class_inv_response_paid").text(result['msg']);
                        $(".class_inv_response_paid").show();
                        $(".class_inv_response_unpaid").text('');
                        $(".class_inv_response_unpaid").hide();
                        // To paid
                        var line = self.props.body.line;
                        if(line){
                            line.set_payment_status('done');
                            // Save data
                            var ret = result['ret'];
                            line.is_pass = true;
                            line.pass_status = result['status'];
                            line.pass_db_ref_no = ret['db_ref_no'];
                            line.pass_textresponse = JSON.stringify(ret);;
                            line.pass_resp_code = ret['resp_code'];
                            line.pass_terminal_id = ret['extra_data']['terminal_id'];
                            line.pass_approval_code = ret['extra_data']['approval_code'];
                            line.pass_payment_request_id = ret['extra_data']['payment_request_id'];
                            line.pass_rrn = ret['extra_data']['rrn'];
                            console.log("======paid==line", line);
                        }
                        delay(500).then(function() {
                            self.cancel();
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
                        return;
                    }
                    else {
                        console.log("=???????==", result['status']);
                        return;
                    }
                });
            }
        }

        cancelInv(){
            var invoice_id = this.props.body['invoice_id'];
            console.log("===cancelInv clicked!", invoice_id);
            var self = this;
            if (invoice_id) {
                rpc.query({
                    model: 'pass.integration',
                    method: 'cancel_invoice',
                    args: [this.env.pos.get_order().pos.config['id'], invoice_id],
                }).then(function(result){
                    console.log('cancel result', result);
                    self.cancel();
                });
            }
        }
    }
    PassQrPopup.template = 'PassQrPopup';
    PassQrPopup.defaultProps = {
        confirmText: 'Ok',
        cancelText: 'Cancel',
        title: 'Confirm ?',
        body: '',
        cheap: false,
        startingValue: null,
        isPassword: false,
    };

    Registries.Component.add(PassQrPopup);

    return PassQrPopup;
});