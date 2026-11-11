odoo.define('kb_pos_digi_pay.DigiPayQrPopup', function(require) {
    'use strict';

    var PopupWidget = require('point_of_sale.popups');
    var gui = require('point_of_sale.gui');

    var DigiPayQrPopup = PopupWidget.extend({
        template: 'DigiPayQrPopup',
    });
    gui.define_popup({name:'DigiPayQrPopup', widget: DigiPayQrPopup});

});