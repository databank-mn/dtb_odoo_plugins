# coding: utf-8
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api, _

class PosPaymentMethod(models.Model):
    _inherit = 'pos.payment.method'

    pass_payment_identifier = fields.Char(help='[Terminal model]-[Serial number], for example: P400Plus-123456789', copy=False)
    is_pass_test_mode = fields.Boolean(string='Active pass test mode', default=False)

    # add PASS payment 
    def _get_payment_terminal_selection(self):
        return super(PosPaymentMethod, self)._get_payment_terminal_selection() + [('pass', 'PASS payment')]
