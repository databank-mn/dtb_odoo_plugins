# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, _
from odoo.exceptions import AccessError, UserError


class PosSessionInherit(models.Model):
    _inherit = 'pos.session'

    go_conn_description = fields.Text(string='DTB go conn description', readonly=True)
    go_conn_sale_count = fields.Float(string='DTB go conn sale_count', default=0, readonly=True)
    go_conn_sale_total = fields.Float(string='DTB go conn sale_total', default=0, readonly=True)
    go_conn_void_count = fields.Float(string='DTB go conn void_count', default=0, readonly=True)
    go_conn_void_total = fields.Float(string='DTB go conn void_total', default=0, readonly=True)

    def go_conn_save_settlement(self, vals):
        """POS UI-аас (browser дээрээс goconnection-ий doSettlement дуудсаны дараа)
        тооцооны үр дүнг хадгална. Энэ method goconnection руу дуудахгүй: goconnection
        нь кассын компьютер дээрх localhost тул зөвхөн browser хүрнэ.

        :param dict vals: description, sale_count, sale_total, void_count, void_total
            (бүгд заавал биш)
        """
        self.ensure_one()
        if not self.env.user.has_group('point_of_sale.group_pos_user'):
            raise AccessError(_("You are not allowed to update this POS session."))
        if self.state == 'closed':
            raise UserError(_("This session is already closed."))

        field_by_key = {
            'description': 'go_conn_description',
            'sale_count': 'go_conn_sale_count',
            'sale_total': 'go_conn_sale_total',
            'void_count': 'go_conn_void_count',
            'void_total': 'go_conn_void_total',
        }
        write_vals = {}
        for key, field_name in field_by_key.items():
            if key not in vals:
                continue
            value = vals[key]
            if key == 'description':
                write_vals[field_name] = str(value or '')[:2000]
                continue
            try:
                write_vals[field_name] = float(value)
            except (TypeError, ValueError):
                raise UserError(_("Invalid settlement value for %s.", key))
        if write_vals:
            # Кассир pos.session дээр талбар бичих эрхгүй байж болох тул sudo.
            self.sudo().write(write_vals)
        return True
