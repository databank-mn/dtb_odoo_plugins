# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields


class PosSessionInherit(models.Model):
    _inherit = 'pos.session'

    def _loader_params_pos_payment_method(self):
        result = super()._loader_params_pos_payment_method()
        result['search_params']['fields'].append('pass_payment_identifier')
        return result

    pass_description = fields.Text(string='Pass description', readonly=True)
    pass_sale_count = fields.Float(string='Pass sale_count', default=0, readonly=True)
    pass_sale_total = fields.Float(string='Pass sale_total', default=0, readonly=True)
    pass_void_count = fields.Float(string='Pass void_count', default=0, readonly=True)
    pass_void_total = fields.Float(string='Pass void_total', default=0, readonly=True)

    def action_pos_session_closing_control(self):
        res = super(PosSessionInherit, self).action_pos_session_closing_control()
        pass_model = self.env['pass.integration']
        for session in self:
            resp = pass_model.settlement_pass(session.config_id.id, session.id)
        return res
