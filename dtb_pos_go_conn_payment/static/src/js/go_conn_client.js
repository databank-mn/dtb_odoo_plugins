// goconnection-тэй харилцахад Odoo-ийн RPC шаарддаг туслахууд (16.0, legacy odoo.define).
odoo.define('dtb_pos_go_conn_payment.go_conn_client', function (require) {
    'use strict';

    const rpc = require('web.rpc');

    // goconnection руу явуулах header. Алдаа гарвал (жишээ нь хувилбар уншиж чадахгүй)
    // төлбөр/тооцоог блоклохгүй, хувилбарыг "-" гэж явуулна.
    async function getGoConnHeaders() {
        let version = '-';
        try {
            version = await rpc.query({
                model: 'ir.module.module',
                method: 'get_module_full_version',
                args: ['dtb_pos_go_conn_payment'],
            });
        } catch (error) {
            console.warn('Go conn: module version unavailable', error);
        }
        return {
            'content-type': 'application/json',
            msp_program_name: 'Odoo ERP, dtb_pos_go_conn_payment: ' + version,
            'Access-Control-Allow-Origin': '*',
        };
    }

    function unlockUi() {
        const overlay = document.getElementById('uiLockId');
        if (overlay) {
            overlay.remove();
        }
        const messageDiv = document.getElementById('countdown_div');
        if (messageDiv) {
            messageDiv.remove();
        }
    }

    // Карт унших / тооцоо хаах хугацаанд дэлгэцийг түгжинэ.
    function lockUi(message) {
        unlockUi();

        const overlay = document.createElement('div');
        overlay.id = 'uiLockId';
        overlay.style.cssText =
            'position: absolute; top: 0; left: 0; z-index: 1000; opacity: 0.6; width: 100%; ' +
            'height: 100%; color: white; background-color: black;';
        document.body.appendChild(overlay);

        const messageDiv = document.createElement('div');
        messageDiv.id = 'countdown_div';
        messageDiv.style.cssText =
            'position: absolute; top: 35%; left: 30%; width: 570px; border: 3px solid #33b5e5; ' +
            'padding: 10px; color: white; font-family: tahoma; font-weight: bold; font-size: 25px; ' +
            'z-index: 5000; opacity: 0.8; background-color: black;';
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
    }

    return {
        getGoConnHeaders: getGoConnHeaders,
        lockUi: lockUi,
        unlockUi: unlockUi,
    };
});
