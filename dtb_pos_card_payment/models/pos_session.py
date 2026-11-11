# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields


class PosSessionInherit(models.Model):
    _inherit = 'pos.session'

    dtb_description = fields.Text(string='Dtb description', readonly=True)
    dtb_sale_count = fields.Float(string='Dtb sale_count', default=0, readonly=True)
    dtb_sale_total = fields.Float(string='Dtb sale_total', default=0, readonly=True)
    dtb_void_count = fields.Float(string='Dtb void_count', default=0, readonly=True)
    dtb_void_total = fields.Float(string='Dtb void_total', default=0, readonly=True)

    # def action_pos_session_closing_control(self, balancing_account=False, amount_to_balance=0, bank_payment_method_diffs=None):
    #     res = super(PosSessionInherit, self).action_pos_session_closing_control(balancing_account=balancing_account, amount_to_balance=amount_to_balance, bank_payment_method_diffs=bank_payment_method_diffs)
    #     pass_model = self.env['pass.integration']
    #     for session in self:
    #         resp = pass_model.settlement_pass(session.config_id.id, session.id)
    #     return res
