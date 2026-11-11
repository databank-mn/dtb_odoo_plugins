# coding: utf-8
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api, _

class PosPaymentMethod(models.Model):
    _inherit = 'pos.payment.method'

    dtb_card_payment_identifier = fields.Char(help='[Terminal model]-[Serial number], for example: P400Plus-123456789', copy=False)

    # add DTB card payment 
    def _get_payment_terminal_selection(self):
        return super(PosPaymentMethod, self)._get_payment_terminal_selection() + [
            ('dtb_goconnection', 'Databank go connection'),
            ('dtb_device_sdk', 'Databank SDK')]


class PosOrderInherit(models.Model):
    _inherit = "pos.order"
    
    @api.model
    def _payment_fields(self, order, ui_paymentline):
        fields = super(PosOrderInherit, self)._payment_fields(order, ui_paymentline)

        fields.update({
            'dtb_terminal_service_id': ui_paymentline.get('dtb_terminal_service_id',False),
            'is_dtb_card': ui_paymentline.get('is_dtb_card',False),
            'dtb_status': ui_paymentline.get('dtb_status',False),
            'dtb_textresponse': ui_paymentline.get('dtb_textresponse',False),
            'dtb_auth_code': ui_paymentline.get('dtb_auth_code',False),
            'dtb_terminal_id': ui_paymentline.get('dtb_terminal_id',False),
            'dtb_merchant_id': ui_paymentline.get('dtb_merchant_id',False),
            'dtb_amount': ui_paymentline.get('dtb_amount',False),
            'dtb_card_no': ui_paymentline.get('dtb_card_no',False),
            'dtb_db_ref_no': ui_paymentline.get('dtb_db_ref_no',False),
            'dtb_ref_no': ui_paymentline.get('dtb_ref_no',False),
        })

        return fields


class PosPaymentInherit(models.Model):
    _inherit = 'pos.payment'

    dtb_terminal_service_id = fields.Char('DTB tsid')
    is_dtb_card = fields.Boolean('Is DTB card', default=False)
    dtb_status = fields.Char('DTB status')
    dtb_textresponse = fields.Char('Textresponse')
    dtb_auth_code = fields.Char('DTB auth code')
    dtb_terminal_id = fields.Char('DTB terminal ID')
    dtb_merchant_id = fields.Char('DTB merchant ID')
    dtb_amount = fields.Char('DTB amount')
    dtb_card_no = fields.Char('Card no')
    dtb_db_ref_no = fields.Char('DTB db_ref_no')
    dtb_ref_no = fields.Char('DTB ref_no')

    # //   "response_message":"Гүйлгээ амжилттай",
    # //   "merchant_name":"Sample Merchant",
    # //   "merchant_id":"000000000000000",
    # //   "terminal_id":"KP000000",
    # //   "card_no":"000000XXXXXX0000",
    # //   "db_ref_no":"20240101000000000",
    # //   "card_type":0,
    # //   "trace_no":9,
    # //   "batch_no":1,
    # //   "acquirer_name":"Sample Acquirer",
    # //   "ref_no":"000000000000",
    # //   "trans_time":"20240101000000",
    # //   "amount":"11688",
    # //   "auth_code":"AAAAAA",
    # //   "has_loyalty":"1",
    # //   "no_txn_amount":"12050",
    # //   "yes_txn_amount":"11688",
    # //   "usable_lp":"362",
    # //   "loyalty_provider_name":"Sample Loyalty Provider"
