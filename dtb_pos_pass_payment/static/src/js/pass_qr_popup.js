odoo.define('dtb_pos_pass_payment.PassQrPopup', function(require) {
    'use strict';

    var PopupWidget = require('point_of_sale.popups');
    var gui = require('point_of_sale.gui');

    var PassQrPopup = PopupWidget.extend({
        template: 'PassQrPopup',
    });
    gui.define_popup({name:'PassQrPopup', widget: PassQrPopup});

});