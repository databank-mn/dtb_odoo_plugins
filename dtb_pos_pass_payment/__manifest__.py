# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'POS pass payment',
    'version': '1.0.2',
    'author': 'DATABANK LLC',
    'website': 'https://databank.mn/',
    'images': ["static/img/sign_up.png"],
    'category': 'Sales/Point of Sale',
    'sequence': 6,
    'description': 'Integrate your POS with an PASS payment method.',
    'summary': 'Integrate your POS with an PASS payment method detailed',
    'data': [
        'security/ir.model.access.csv',
        'data/pass_payment_method_data.xml',
        'views/res_config_settings_views.xml',
        'views/pos_payment_method_inherit_view.xml',
    ],
    'depends': ['point_of_sale'],
    'installable': True,
    'auto_install': False,
    'assets': {
        'point_of_sale.assets': [
            'dtb_pos_pass_payment/static/src/js/models.js',
            'dtb_pos_pass_payment/static/src/js/pass_payment.js',
            'dtb_pos_pass_payment/static/src/js/pass_qr_popup.js',
            'dtb_pos_pass_payment/static/src/js/PaymentScreen.js',
            'dtb_pos_pass_payment/static/src/css/pass.css',
        ],
        'web.assets_qweb': [
            "dtb_pos_pass_payment/static/src/xml/pass_qr_popup.xml",
        ],
    },
    'license': 'GPL-3',
    'price': 0, 
    'currency': 'EUR',
}
