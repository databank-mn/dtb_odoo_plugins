# -*- coding: utf-8 -*-

from odoo import api, models, fields
import json
from datetime import date, datetime, timedelta
from odoo.exceptions import UserError
from odoo.tools.translate import _
import requests
import logging

import qrcode
import base64
from io import StringIO, BytesIO
from PIL import Image
from odoo import modules
from pytz import timezone

_logger = logging.getLogger(__name__)


class PassIntegration(models.TransientModel):
    _name = "pass.integration"
    _description = 'PASS integration'

    # Create Order to PASS
    @api.model
    def create_invoice(self, order_name, config_id, amount=0, session_id='-'):
        _logger.info("---- Pass create invoice, %s, %s, %s, %s" % (order_name, config_id, amount, session_id))
        pos_config = self.env['pos.config'].browse(config_id)
        pass_ecommerce_token, test_mode_on = self._get_pass_token(pos_config)
        if pass_ecommerce_token:
            if amount <= 0:
                return {
                    'status': 'ng',
                    'code': '-',
                    'body': 'Must be transaction amount > 0 !'
                }
            headers = {'Content-Type': 'application/json'}
            body = {
                "ecommerce_token": pass_ecommerce_token,
                "amount": amount * 100,
                "pos_id": session_id,
            }
            try:
                invoice_base_url = self._convert_url(self.env.company.pass_invoice_create_url, test_mode_on)
                response = requests.post(invoice_base_url, headers=headers, data=json.dumps(body))
                if response.status_code == 200:
                    response_data = response.json()
                    if response_data.get('status_code', 'ng') == 'ok':
                        _logger.info("---- Pass create invoice, response success %s" % (response_data))
                        qr_data = response_data.get('ret', {}).get('order_id')
                        qr_image = self._qr_generate(qr_data)
                        invoice_id = qr_data.split('/')[-1]
                        return {
                            'status': 'ok',
                            'qr_data': qr_image, 
                            'invoice_id': invoice_id}
                    else:
                        return {
                            'status': 'ng',
                            'code': response_data.get('msg', {}).get('code'),
                            'body': response_data.get('msg', {}).get('body')
                        }
                else:
                    _logger.info("---- Pass create invoice, response failed \n%s" % (response.json()))
                    raise UserError(_('Pass invoice create error! code: %s, message: %r' % (response.status_code, response.json()['msg'])))
            except requests.ConnectionError:
                raise UserError(_('Pass Invoice create connection error!'))
        else:
            # raise UserError(_('Please set Pass Ecommerce token!'))
            return {
                'status': 'ng',
                'code': '-',
                'body': 'Please set Pass Ecommerce token!'
            }

    # Success response
    # {
    #     'status_code': 'ok', 
    #     'ret': {
    #         'shop': 'Sample Shop', 
    #         'amount': '7880.0', 
    #         'order_id': 'http://pass.mn/order/00000000000000000000000000000000', 
    #         'order_ttl': 600, 
    #         'db_ref_no': '20240101000000000'
    #     }
    # } 

    @api.model
    def check_invoice(self, config_id, invoice_id):
        _logger.info("---- Pass check_invoice, request %s, %s" % (config_id, invoice_id))
        pos_config = self.env['pos.config'].browse(config_id)
        pass_ecommerce_token, test_mode_on = self._get_pass_token(pos_config)
        if pass_ecommerce_token:
            headers = {'Content-Type': 'application/json'}
            body = {
                "ecommerce_token": pass_ecommerce_token,
                "order_id": invoice_id,
            }
            try:
                check_invoice_base_url = self._convert_url(self.env.company.pass_invoice_check_url, test_mode_on)
                response = requests.post(check_invoice_base_url, headers=headers, data=json.dumps(body),
                                         verify=True)
                if response.status_code == 200:
                    response_data = response.json()
                    if response_data.get('status_code', 'ng') == 'ok':
                        _logger.info("---- Pass check_invoice, response paid %s" % (response_data))
                        status = response_data.get('ret', {}).get('status')
                        status_text = response_data.get('ret', {}).get('status_text')
                        return {
                            'invoice_id': invoice_id,
                            'msg': status_text, 
                            'status': status,
                            'ret': response_data.get('ret', {}),
                        }
                    else:
                        _logger.info("---- Pass check_invoice, response unpiad %s" % (response_data))
                        return {
                            'status': 'ng',
                            'code': response_data.get('msg', {}).get('code'),
                            'body': response_data.get('msg', {}).get('body')
                        }
                else:
                    raise UserError(_('Pass check_invoice error! code: %s, message: %s' % (
                    response.status_code, response.json()['message'])))
            except requests.ConnectionError:
                raise UserError(_('Pass check_invoice connection error!'))
        else:
            return {
                'status': 'ng',
                'code': '-',
                'body': 'Please set Pass Ecommerce token!'
            }

    # == Response
    # {
    #    "status_code":"ok",
    #    "ret":{
    #       "status":"paid",
    #       "amount":"70.00",
    #       "customer_data":{
    #          "user_id":"0"
    #       },
    #       "loyalty_data":{
             
    #       },
    #       "db_ref_no":"20240101000000000",
    #       "extra_data":{
    #          "_id":"000000000000000000000000",
    #          "pan":"000000XXXXXX0000",
    #          "rrn":"000000000000",
    #          "amount":"70.00",
    #          "pos_id":"dtb_00000000",
    #          "order_id":"http://pass.mn/order/00000000000000000000000000000000",
    #          "resp_msg":"freestyle Success",
    #          "trace_no":"000009",
    #          "date_time":"0115180450",
    #          "resp_code":"000",
    #          "entry_mode":"090",
    #          "terminal_id":"KP000000",
    #          "approval_code":"AAAAAA",
    #          "currency_code":"496",
    #          "condition_code":"00",
    #          "payment_request_id":"00000000000000000000000"
    #       },
    #       "resp_code":"000",
    #       "resp_msg":"freestyle Success",
    #       "status_text":"Гүйлгээ амжилттай."
    #    }
    # }

    # Cancel Order to PASS
    @api.model
    def cancel_invoice(self, config_id, invoice_id):
        _logger.info("---- Pass cancel_invoice data: %s %s" % (config_id, invoice_id))
        pos_config = self.env['pos.config'].browse(config_id)
        pass_ecommerce_token, test_mode_on = self._get_pass_token(pos_config)
        if pass_ecommerce_token:
            headers = {'Content-Type': 'application/json'}
            body = {
                "ecommerce_token": pass_ecommerce_token,
                "order_id": invoice_id,
            }
            try:
                cancel_invoice_base_url = self._convert_url(self.env.company.pass_invoice_cancel_url, test_mode_on)
                response = requests.post(cancel_invoice_base_url, headers=headers, data=json.dumps(body),
                                         verify=True)
                if response.status_code == 200:
                    response_data = response.json()
                    if response_data.get('status_code', 'ng') == 'ok':
                        _logger.info("---- Pass cancel_invoice, response cancel %s" % (response_data))
                        status = response_data.get('ret', {}).get('status')
                        status_text = response_data.get('ret', {}).get('status_text', 'Cancelled')
                        return {
                            'msg': status_text, 
                            'status': status
                        }
                    else:
                        _logger.info("---- Pass cancel_invoice, response unpiad %s" % (response_data))
                        return {
                            'status': 'ng',
                            'code': response_data.get('msg', {}).get('code'),
                            'body': response_data.get('msg', {}).get('body')
                        }
                else:
                    raise UserError(_('Pass cancel_invoice error! code: %s, message: %s' % (
                    response.status_code, response.json()['message'])))
            except requests.ConnectionError:
                raise UserError(_('Pass cancel_invoice connection error!'))
        else:
            return {
                'status': 'ng',
                'code': '-',
                'body': 'Please set Pass Ecommerce token!'
            }

    # Resp
    # {
    #    "status_code":"ng",
    #    "ret":"None",
    #    "msg":{
    #       "code":"EC15",
    #       "level":"4",
    #       "body":"Order cannot be cancelled, status is 'expired'."
    #    }
    # }
    

    # PASS settlement
    @api.model
    def settlement_pass(self, config_id, session_id, date_start=False, date_end=False):
        _logger.info("---- Pass settlement data: %s %s %s->%s" % (config_id, session_id, date_start, date_end))
        pos_config = self.env['pos.config'].browse(config_id)
        pos_session = self.env['pos.session'].browse(session_id)
        pass_ecommerce_token, test_mode_on = self._get_pass_token(pos_config)
        if pass_ecommerce_token:
            if not date_start or not date_end:
                date_start = pos_session.start_at
                date_end = pos_session.stop_at
            # USER TIMEZONE
            user_tz = self.env.user.tz
            date_start = date_start.astimezone(timezone(user_tz))
            date_end = date_end.astimezone(timezone(user_tz))

            headers = {'Content-Type': 'application/json'}
            body = {
                "ecommerce_token": pass_ecommerce_token,
                "start_datetime": date_start.strftime("%Y-%m-%d %H:%M:%S"),
                "end_datetime": date_end.strftime("%Y-%m-%d %H:%M:%S"),
            }
            try:
                settlement_base_url = self._convert_url(self.env.company.pass_settlement_url, test_mode_on)
                response = requests.post(settlement_base_url, headers=headers, data=json.dumps(body),
                                         verify=True)
                if response.status_code == 200:
                    response_data = response.json()
                    if response_data.get('status_code', 'ng') == 'ok':
                        _logger.info("---- Pass settlement, response: %s" % (response_data))
                        status = response_data.get('ret', {}).get('resp_code')
                        status_text = response_data.get('ret', {}).get('resp_msg', 'Default settlement text')
                        sale_count = response_data.get('ret', {}).get('sale_count', 0)
                        sale_total = response_data.get('ret', {}).get('sale_total', 0)
                        void_count = response_data.get('ret', {}).get('void_count', 0)
                        void_total = response_data.get('ret', {}).get('void_total', 0)
                        # Save
                        pos_session.pass_description = status_text
                        pos_session.pass_sale_count = sale_count
                        pos_session.pass_sale_total = sale_total
                        pos_session.pass_void_count = void_count
                        pos_session.pass_void_total = void_total
                        return {
                            'msg': status_text, 
                            'status': status,
                            'sale_count': sale_count,
                            'sale_total': sale_total,
                            'void_count': void_count,
                            'void_total': void_total,
                        }
                    else:
                        _logger.info("---- Pass settlement, response: %s" % (response_data))
                        pos_session.pass_description = response_data.get('msg', {}).get('body')
                        return {
                            'status': 'ng',
                            'code': response_data.get('msg', {}).get('code'),
                            'body': response_data.get('msg', {}).get('body')
                        }
                else:
                    pos_session.pass_description = response.json()['message']
                    # raise UserError(_('Pass settlement error! code: %s, message: %s' % (
                    # response.status_code, response.json()['message'])))
            except requests.ConnectionError:
                pos_session.pass_description = "Pass settlement connection error"
                # raise UserError(_('Pass settlement connection error!'))
        else:
            pos_session.pass_description
            return {
                'status': 'ng',
                'code': '-',
                'body': 'Please set Pass Ecommerce token!'
            }


    # GET pass token
    def _get_pass_token(self, pos_config):
        pass_method = self.env['pos.payment.method'].sudo().search([
            ('use_payment_terminal','=','pass'),
            ('is_pass_test_mode','=',True)], limit=1)
        if pass_method and pass_method.is_pass_test_mode:
            _logger.info("---- Pass _get_pass_token TEST mode is '%s'" % (pass_method.is_pass_test_mode))
            # Pass TEST горимын token-г кодонд хадгалахгүй. Settings → Technical → System Parameters дээр
            # `dtb_pos_pass_payment.test_ecommerce_token` түлхүүрээр тохируулна. Тохируулаагүй бол token хоосон тул
            # "Please set Pass Ecommerce token!" гэсэн алдаа гарна. Production горим хөндөгдөөгүй.
            test_token = self.env['ir.config_parameter'].sudo().get_param('dtb_pos_pass_payment.test_ecommerce_token')
            return test_token or False, pass_method.is_pass_test_mode
        else:
            return pos_config.pass_ecommerce_token, False

    def _convert_url(self, url, test_mode_on):
        if test_mode_on:
            url = url.replace('ecom.pass', 'ecomstg.pass')
        return url

    def _qr_generate(self, data):
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=0,
        )
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#010101", back_color="white")
        # Logo
        path = modules.get_module_resource('dtb_pos_pass_payment', 'static/description/icon3.png')
        logo = Image.open(path)
        # logo = logo.resize((40, 40), Image.ANTIALIAS)
        qr_img_size = img.size
        logo_position = (
            (qr_img_size[0] - 40) // 2,
            (qr_img_size[1] - 40) // 2,
        )
        # Paste the logo on the QR code
        img.paste(logo, logo_position)
        # Save
        buffered = BytesIO()
        img.save(buffered)
        img_str = base64.b64encode(buffered.getvalue())
        return img_str