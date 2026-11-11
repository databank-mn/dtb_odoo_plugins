# coding: utf-8
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api, _

class PosPaymentMethod(models.Model):
    _inherit = 'pos.payment.method'

    dtb_go_conn_payment_identifier = fields.Char(help='[Terminal model]-[Serial number], for example: P400Plus-123456789', copy=False)
    go_conn_settle_on_close = fields.Boolean(
        string='Settle on session close',
        default=False,
        help='POS session хаахын өмнө Go connection-ий тооцоо хаах (doSettlement)-г автоматаар дуудна. '
             'Анхдагчаар унтраалттай: хуучин суулгацад шинэчлэлийн дараа ажиллагаа өөрчлөгдөхгүй. '
             'Асаахын өмнө Databank Connection програм кассын компьютер дээр ажиллаж байх ёстойг анхаар.',
    )

    # Odoo 20: `use_payment_terminal`/_get_payment_terminal_selection байхгүй болж, терминалын
    # provider-ийг _get_terminal_provider_selection-оор нэмдэг (payment_method_type = 'terminal').
    def _get_terminal_provider_selection(self):
        return super()._get_terminal_provider_selection() + [('dtb_go_conn', 'Databank Go connection')]

    # POS UI рүү ачаалах талбарууд
    @api.model
    def _load_pos_data_fields(self, config):
        params = super()._load_pos_data_fields(config)
        params += ['dtb_go_conn_payment_identifier', 'go_conn_settle_on_close']
        return params
