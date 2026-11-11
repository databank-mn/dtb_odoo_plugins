# coding: utf-8
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import logging

from odoo import api, fields, models, _
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)


class PosConfig(models.Model):
    _inherit = 'pos.config'

    pass_ecommerce_token = fields.Char(string='Pass Ecommerce Token', readonly=False)


class PosOrderInherit(models.Model):
    _inherit = "pos.order"

    @api.model
    def _payment_fields(self, order, ui_paymentline):
        fields = super(PosOrderInherit, self)._payment_fields(order, ui_paymentline)

        fields.update({
            'is_pass': ui_paymentline.get('is_pass'),
            'pass_status': ui_paymentline.get('pass_status'),
            'pass_db_ref_no': ui_paymentline.get('pass_db_ref_no'),
            'pass_textresponse': ui_paymentline.get('pass_textresponse'),
            'pass_resp_code': ui_paymentline.get('pass_resp_code'),
            'pass_terminal_id': ui_paymentline.get('pass_terminal_id'),
            'pass_approval_code': ui_paymentline.get('pass_approval_code'),
            'pass_payment_request_id': ui_paymentline.get('pass_payment_request_id'),
            'pass_rrn': ui_paymentline.get('pass_rrn'),
        })

        return fields


class PosPaymentInherit(models.Model):
    _inherit = 'pos.payment'

    is_pass = fields.Boolean('Is PASS', default=False)
    pass_status = fields.Char('PASS status')
    pass_db_ref_no = fields.Char('PASS db ref no')
    pass_textresponse = fields.Char('PASS resp text')
    pass_resp_code = fields.Char('Resp code')
    pass_terminal_id = fields.Char('PASS terminal ID')
    pass_approval_code = fields.Char('PASS auth code')
    pass_payment_request_id = fields.Char('PASS req')
    pass_rrn = fields.Char('Pass RRN')