# coding: utf-8
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import logging

from odoo import api, fields, models, _

_logger = logging.getLogger(__name__)


class Module(models.Model):
    _inherit = "ir.module.module"

    @api.model
    def get_module_full_version(self, module_name):
        module_info = self.env['ir.module.module'].get_module_info(module_name)
        if module_info:
            return module_info.get('version', '-')
        else:
            return ''


class PosPaymentInherit(models.Model):
    # Odoo 19: POS UI-ийн төлбөрийн мөрүүд `payment_ids` ORM command-аар шууд бичигддэг
    # тул (pos.order._payment_fields байхгүй болсон) go_conn_* талбарууд өөр mapping
    # шаардахгүй.
    _inherit = 'pos.payment'

    is_go_conn = fields.Boolean('Is Go conn', default=False)
    go_conn_amount = fields.Char('Amount')
    go_conn_db_ref_no = fields.Char('db ref no')
    go_conn_resp_code = fields.Char('Resp code')
    go_conn_rrn = fields.Char('RRN')
    go_conn_textresponse = fields.Char('resp text')
    go_conn_aid = fields.Char('AID')
    go_conn_pan = fields.Char('PAN')
    go_conn_model = fields.Char('Model')
    go_conn_trace_no = fields.Char('trace_no')
    go_conn_terminal_id = fields.Char('terminal_id')
