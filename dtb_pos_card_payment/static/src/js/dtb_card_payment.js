odoo.define('dtb_pos_card_payment.payment', function (require) {
    "use strict";

    var core = require('web.core');
    var rpc = require('web.rpc');
    var PaymentInterface = require('point_of_sale.PaymentInterface');
    const { Gui } = require('point_of_sale.Gui');
    var delay = require("web.concurrency").delay;
    var utils = require('report.utils');

    var localStorage = require('web.local_storage');

    var _t = core._t;

    var PaymentDtbCard = PaymentInterface.extend({
        send_payment_request: function (cid) {
            console.log("==send_payment_request=", cid);
            this._super.apply(this, arguments);
            return this._dtb_card_create(cid);
        },
        send_payment_cancel: function (order, cid) {
            this._super.apply(this, arguments);
            console.log("==send_payment_cancel=", order);
            return this._dtb_card_cancel(order);
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

        pending_dtb_card_line() {
          return this.pos.get_order().paymentlines.find(
            paymentLine => paymentLine.payment_method.use_payment_terminal === 'dtb_device_sdk' && (!paymentLine.is_done()));
        },

        enable_reversals: function () {
            this.supports_reversals = true;
        },

        // ========================== CUSTOM methods ===========********************************************

        _dtb_card_create: function (cid) {
            // Get base URL
            var web_base_url = window.origin;
            var trusted_host = utils.get_host_from_url(web_base_url);
            // CHECK working DEVICE
            let userAgent = window.navigator.userAgent;
            console.log("===", userAgent, cid, web_base_url, trusted_host);
            var isDtbDevice = false;
            if (userAgent.indexOf("DtbDevice") != -1) {
                isDtbDevice = true;
            }
            if(isDtbDevice == false){
                this._show_error("Databank-ны төхөөрөмж дээр төлөх боломжтой!", "Payment method error");
                return;
            }
            
            var self = this;
            var order = this.pos.get_order();

            if (order.selected_paymentline.amount < 0) {
                this._show_error(_t('Cannot process transactions with negative amount.'));
                return Promise.resolve();
            }

            var line = order.paymentlines.find(paymentLine => paymentLine.cid === cid);
            var amount = line.amount;
            var db_ref_no = Date.now().toString() +"cid"+ cid;
            line.set_payment_status('waiting');
            console.log(db_ref_no, amount, cid, "====_dtb_card_create", line);
            
            // To save
            localStorage.setItem("DtbDevice."+db_ref_no, 'waiting');
            // redirect
            window.location.replace("dtbodoo://pos.payment.databank.mn/?amount="+amount+"&db_ref_no="+db_ref_no);
            // Inquiry
            self.checkPayment(line, db_ref_no, 30);
        },

        checkPayment(line, db_ref_no, count) {
            console.log("===checkPayment - Inquiry", db_ref_no, count, localStorage.getItem("DtbDevice."+db_ref_no));
            var self = this;
            if (count > 0) {
                if (localStorage.getItem("DtbDevice."+db_ref_no) === 'done') {
                    // Хэрэв амжилттай бол
                    if(line){
                        line.set_payment_status('done');
                        // Clear
                        localStorage.removeItem("DtbDevice."+db_ref_no);
                        // Save data
                        var resp = localStorage.getItem("DtbDevice."+db_ref_no+'_resp');
                        var res_data = JSON.parse(resp);
                        console.log("==**2****************************=resp", res_data.auth_code);
                        line.is_dtb_card = true;
                        line.dtb_status = res_data.response_code;
                        line.dtb_textresponse = resp;
                        line.dtb_auth_code = res_data.auth_code;
                        line.dtb_terminal_id = res_data.terminal_id;
                        line.dtb_merchant_id = res_data.merchant_id;
                        line.dtb_amount = res_data.amount;
                        line.dtb_card_no = res_data.card_no;
                        line.dtb_db_ref_no = res_data.db_ref_no;
                        line.dtb_ref_no = res_data.ref_no;
                        localStorage.removeItem("DtbDevice."+db_ref_no+'_resp');
                        localStorage.clear();
                    } else {
                        console.log("======Not found paymentline", db_ref_no);
                    }
                } else if (localStorage.getItem("DtbDevice."+db_ref_no) === 'cancelled') {
                    // Cancel хийсэн бол
                    if(line){
                        line.set_payment_status('retry');
                        var resp = localStorage.getItem("DtbDevice."+db_ref_no+'_resp');
                        var res_data = JSON.parse(resp);
                        console.log("==cancelled=", res_data);
                        // Clear
                        localStorage.removeItem("DtbDevice."+db_ref_no);
                        localStorage.removeItem("DtbDevice."+db_ref_no+'_resp');
                        localStorage.clear();
                    }
                } else if (localStorage.getItem("DtbDevice."+db_ref_no) === 'waiting') {
                    // Хийгдэхийг хүлээж байвад
                    count--;
                    return delay(1500)
                        .then(function() {
                            self.checkPayment(line, db_ref_no, count);
                        });
                } else {
                    console.log("=???????= Unknown DTB=");
                    line.set_payment_status('retry');
                }
            } else {
                console.log("=???????= TIMEOUT DTB=");
                line.set_payment_status('retry');
            }
        },

        _dtb_card_cancel: function (order) {
            var self = this;
            var line = self.pending_dtb_card_line()
            var invoice_id = self.get_invoice_id();

            line.set_payment_status('retry');
            line.transaction_id = false;
            self.set_invoice_id(null);
        },

        // *********************** VOID буюу буцаалт хийх - Заавар ***********************
        // trace_no, db_ref_no - энэ хоёрыг payment дээрээс авч дамжуулах ёстой
        // To save
        // localStorage.setItem(trace_no, false);
        // redirect
        // window.location.replace("dtbodoo://pos.void.databank.mn/?trace_no="+trace_no+"&db_ref_no="+db_ref_no);

        // *************************************************************************************************
        
        _show_error: function (msg, title) {
            if (!title) {
                title =  _t('Bank Error');
            }
            Gui.showPopup('ErrorPopup',{
                'title': title,
                'body': msg,
            });
        },
    });

    return PaymentDtbCard;
});
