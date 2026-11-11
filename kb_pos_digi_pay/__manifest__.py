# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'POS DigiPay',
    'version': '1.0.2',
    'author': 'DATABANK LLC',
    'website': 'https://www.khanbank.com/',
    'images': ["static/img/app_banner.png"],
    'category': 'Sales/Point of Sale',
    'sequence': 6,
    'description': 'Integrate your POS with an DigiPay method.',
    'summary': 'Integrate your POS with an DigiPay method detailed',
    'data': [
        'security/ir.model.access.csv',
        'data/digi_payment_method_data.xml',
        'views/res_config_settings_views.xml',
        'views/pos_payment_method_inherit_view.xml',
        'views/pos_inherit_assets_view.xml',
    ],
    'depends': ['point_of_sale'],
    'qweb': ['static/src/xml/digi_qr_popup.xml'],
    'installable': True,
    'auto_install': False,
    'license': 'GPL-3',
    'price': 0, 
}
