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

    # add DTB go conn payment
    def _get_payment_terminal_selection(self):
        return super(PosPaymentMethod, self)._get_payment_terminal_selection() + [('dtb_go_conn', 'Databank Go connection')]

    # POS UI рүү ачаалах талбарууд (Odoo 17-ийн _loader_params_pos_payment_method-ийг орлоно)
    @api.model
    def _load_pos_data_fields(self, config_id):
        params = super()._load_pos_data_fields(config_id)
        params += ['dtb_go_conn_payment_identifier', 'go_conn_settle_on_close']
        return params
