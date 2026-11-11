# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'POS card payment',
    'version': '1.0.1',
    'author': 'DATABANK LLC',
    'website': 'https://databank.mn/',
    'images': ["static/img/banner.png"],
    'category': 'Sales/Point of Sale',
    'sequence': 6,
    'description': 'Integrate your POS with an card payment method.',
    'summary': 'Integrate your POS with an card payment method detailed',
    'data': [
        'data/card_payment_method_data.xml',
        'views/pos_payment_method_inherit_view.xml',
    ],
    'depends': ['point_of_sale'],
    'installable': True,
    'auto_install': False,
    'assets': {
        'point_of_sale.assets': [
            'dtb_pos_card_payment/static/src/js/models.js',
            'dtb_pos_card_payment/static/src/js/PaymentScreen.js',
            'dtb_pos_card_payment/static/src/js/dtb_card_payment.js',
            'dtb_pos_card_payment/static/src/xml/dtb_popup.xml',
        ],
    },
    'license': 'GPL-3',
    'price': 0, 
    'currency': 'EUR',
}
