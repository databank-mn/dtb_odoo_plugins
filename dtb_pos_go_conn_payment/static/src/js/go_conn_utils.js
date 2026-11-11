// Go connection (localhost:27028) дуудлагын цэвэр функцууд (16.0, legacy odoo.define).
// Энд Odoo-ийн ямар ч require байхгүй: Node дээр шууд туршиж болно.
// Хуучин хөтчийг бодож `?.`, `??`, `replaceAll` ашиглаагүй.
odoo.define('dtb_pos_go_conn_payment.go_conn_utils', function () {
    'use strict';

    const GO_CONN_URL = 'http://localhost:27028';
    const GO_CONN_TERMINAL = 'dtb_go_conn';
    // goconnection өөрөө 80 секундэд таслана. Үүнээс урт хүлээвэл goconnection гацсан гэж үзнэ.
    const SETTLEMENT_TIMEOUT_MS = 120000;

    /**
     * Session хаахад goconnection-ий тооцоо хаах шаардлагатай юу?
     * Тухайн POS-ийн төлбөрийн аргын нэг нь Go connection бөгөөд "Session хаахад
     * тооцоо хаах" сонголтыг **асаасан** байх ёстой (opt-in). Талбар ачаалагдаагүй
     * (undefined) бол асаагаагүй гэж үзнэ: тохируулгагүйгээр тооцоо хаахгүй.
     */
    function needsGoConnSettlement(paymentMethods) {
        return paymentMethods.some(function (pm) {
            return (
                pm &&
                (pm.use_payment_terminal === GO_CONN_TERMINAL || pm.payment_provider === GO_CONN_TERMINAL) &&
                pm.go_conn_settle_on_close === true
            );
        });
    }

    function removeDashes(text) {
        return text.split('-').join('');
    }

    /** Session-ий эхэлсэн огноог "YYYYMMDD" болгоно (UTC). */
    function sessionStartDate(startAt) {
        if (!startAt) {
            return null;
        }
        if (typeof startAt === 'string') {
            return removeDashes(startAt.substring(0, 10));
        }
        if (typeof startAt.toUTC === 'function') {
            return removeDashes(startAt.toUTC().toISODate());
        }
        if (startAt instanceof Date) {
            return removeDashes(startAt.toISOString().substring(0, 10));
        }
        return null;
    }

    /**
     * goconnection-ий `db_ref_no`: session-ий эхэлсэн огноо + session.id.
     * Sale болон settlement хоёр яг ижил утга ашиглана. goconnection 18 тэмдэгтээс
     * ихгүй, зай агуулаагүй байхыг шаарддаг.
     */
    function formatDbRefNo(session, now) {
        now = now || new Date();
        const date =
            sessionStartDate(session ? session.start_at : null) ||
            removeDashes(now.toISOString().substring(0, 10));
        return date + (session ? session.id : '000');
    }

    function buildSettlementBody(dbRefNo) {
        return {
            service_name: 'doSettlement',
            service_params: { db_ref_no: dbRefNo },
        };
    }

    function toInt(value) {
        const n = parseInt(String(value == null ? '0' : value), 10);
        return isFinite(n) ? n : 0;
    }

    function textOf(value, fallback) {
        return String(value == null ? fallback : value);
    }

    /**
     * `doSettlement`-ийн хариуг задлана. Амжилт нь зөвхөн `status === true` ба
     * `response_code === "000"` үед. Дүн нь minor unit (x100) тул 100-д хуваана.
     */
    function parseSettlementResponse(data) {
        const resp = data && data.response;
        if (data && data.status === true && resp) {
            const code = textOf(resp.response_code, '-');
            const msg = textOf(resp.response_msg, '');
            if (code === '000') {
                return {
                    ok: true,
                    code: code,
                    msg: msg,
                    saleCount: toInt(resp.sale_count),
                    saleTotal: toInt(resp.sale_total) / 100,
                    voidCount: toInt(resp.void_count),
                    voidTotal: toInt(resp.void_total) / 100,
                };
            }
            return { ok: false, code: code, msg: msg };
        }
        if (resp && resp.Exception) {
            return {
                ok: false,
                code: textOf(resp.Exception.ErrorCode, '-'),
                msg: textOf(resp.Exception.ErrorMessage, ''),
            };
        }
        if (data && data.status_code === 'ng') {
            const m = data.msg || {};
            return { ok: false, code: textOf(m.code, '-'), msg: textOf(m.body, '') };
        }
        return { ok: false, code: '-', msg: 'Тооцооны хариу танигдсангүй' };
    }

    function describeFailure(result) {
        return 'Код: ' + result.code + ', ' + result.msg;
    }

    /**
     * goconnection руу `doSettlement` явуулна. Хэзээ ч throw хийхгүй: холболтын алдаа,
     * HTTP алдаа, timeout-ыг `{ok: false, ...}` болгоно.
     * Timeout (анхдагч 120 сек): goconnection өөрөө 80 секундэд таслдаг тул үүнээс урт
     * хүлээх нь goconnection гацсан гэсэн үг. Эс бөгөөс кассирын дэлгэц хязгааргүй
     * түгжигдэнэ. Timeout болбол автоматаар дахин оролдохгүй: кассир өөрөө шийднэ.
     */
    async function doSettlement(headers, dbRefNo, options) {
        options = options || {};
        const url = options.url || GO_CONN_URL;
        const timeoutMs = options.timeoutMs || SETTLEMENT_TIMEOUT_MS;
        const fetchImpl =
            options.fetchImpl ||
            function () {
                return fetch.apply(null, arguments);
            };
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timer = controller
            ? setTimeout(function () {
                  controller.abort();
              }, timeoutMs)
            : null;
        try {
            const response = await fetchImpl(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(buildSettlementBody(dbRefNo)),
                signal: controller ? controller.signal : undefined,
            });
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return parseSettlementResponse(await response.json());
        } catch (error) {
            if (error && error.name === 'AbortError') {
                return {
                    ok: false,
                    code: 'TIMEOUT',
                    msg:
                        'goconnection ' +
                        Math.round(timeoutMs / 1000) +
                        ' секундэд хариу өгсөнгүй. Терминал болон Databank Connection програмыг шалгана уу.',
                };
            }
            return { ok: false, code: '-', msg: 'Алдаа: ' + error.message };
        } finally {
            if (timer) {
                clearTimeout(timer);
            }
        }
    }

    return {
        GO_CONN_URL: GO_CONN_URL,
        GO_CONN_TERMINAL: GO_CONN_TERMINAL,
        SETTLEMENT_TIMEOUT_MS: SETTLEMENT_TIMEOUT_MS,
        needsGoConnSettlement: needsGoConnSettlement,
        sessionStartDate: sessionStartDate,
        formatDbRefNo: formatDbRefNo,
        buildSettlementBody: buildSettlementBody,
        parseSettlementResponse: parseSettlementResponse,
        describeFailure: describeFailure,
        doSettlement: doSettlement,
    };
});
