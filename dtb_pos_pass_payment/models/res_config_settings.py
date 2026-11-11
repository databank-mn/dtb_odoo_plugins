# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api


class ResCompany(models.Model):
    _inherit = "res.company"

    pass_invoice_create_url = fields.Char(string='Invoice create url', default='https://ecom.pass.mn/openapi/v1/ecom/create_order')
    pass_invoice_check_url = fields.Char(string='Invoice check url', default='https://ecom.pass.mn/openapi/v1/ecom/order_inquiry')
    pass_invoice_cancel_url = fields.Char(string='Invoice cancel url', default='https://ecom.pass.mn/openapi/v1/ecom/cancel_order')
    pass_settlement_url = fields.Char(string='Settlement url', default='https://ecom.pass.mn/openapi/v1/ecom/settlement')


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    pass_invoice_create_url = fields.Char(related='company_id.pass_invoice_create_url', string='Invoice create url', readonly=False)
    pass_invoice_check_url = fields.Char(related='company_id.pass_invoice_check_url', string='Invoice check url', readonly=False)
    pass_invoice_cancel_url = fields.Char(related='company_id.pass_invoice_cancel_url', string='Invoice cancel url', readonly=False)
    pass_settlement_url = fields.Char(related='company_id.pass_settlement_url', string='Settlement url', readonly=False)