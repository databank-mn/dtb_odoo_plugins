/** @odoo-module **/

// Go connection (localhost:27028) дуудлагын цэвэр функцууд.
// Энд Odoo-ийн ямар ч import байхгүй: sale болон settlement хоёулаа ашиглана,
// мөн Node дээр шууд туршиж болно.

export const GO_CONN_URL = "http://localhost:27028";
export const GO_CONN_TERMINAL = "dtb_go_conn";
// goconnection өөрөө 80 секундэд таслана. Үүнээс урт хүлээвэл goconnection гацсан гэж үзнэ.
export const SETTLEMENT_TIMEOUT_MS = 120000;

/**
 * Session хаахад goconnection-ий тооцоо хаах шаардлагатай юу?
 * Тухайн POS-ийн төлбөрийн аргуудын нэг нь Go connection бөгөөд "Session хаахад
 * тооцоо хаах" сонголтыг **асаасан** байх ёстой (opt-in). Талбар ачаалагдаагүй
 * (undefined) бол асаагаагүй гэж үзнэ: тохируулгагүйгээр тооцоо хаахгүй.
 */
export function needsGoConnSettlement(paymentMethods) {
    // Odoo 20-д `use_payment_terminal` талбар `payment_provider` болсон тул хоёуланг шалгана.
    return paymentMethods.some(
        (pm) =>
            (pm?.use_payment_terminal === GO_CONN_TERMINAL || pm?.payment_provider === GO_CONN_TERMINAL) &&
            pm.go_conn_settle_on_close === true
    );
}

/**
 * Session-ий эхэлсэн огноог "YYYYMMDD" болгоно (UTC).
 * Odoo 19-д `pos.session.start_at` нь luxon DateTime; өмнөх хувилбарт string/Date байсан.
 */
export function sessionStartDate(startAt) {
    if (!startAt) {
        return null;
    }
    if (typeof startAt === "string") {
        return startAt.substring(0, 10).replaceAll("-", "");
    }
    if (typeof startAt.toUTC === "function") {
        return startAt.toUTC().toISODate().replaceAll("-", "");
    }
    if (startAt instanceof Date) {
        return startAt.toISOString().substring(0, 10).replaceAll("-", "");
    }
    return null;
}

/**
 * goconnection-ий `db_ref_no`: session-ий эхэлсэн огноо + session.id.
 * Sale болон settlement хоёр яг ижил утга ашиглана. goconnection 18 тэмдэгтээс
 * ихгүй, зай агуулаагүй байхыг шаарддаг.
 */
export function formatDbRefNo(session, now = new Date()) {
    const date =
        sessionStartDate(session?.start_at) ??
        now.toISOString().substring(0, 10).replaceAll("-", "");
    return date + (session ? session.id : "000");
}

export function buildSettlementBody(dbRefNo) {
    return {
        service_name: "doSettlement",
        service_params: { db_ref_no: dbRefNo },
    };
}

function toInt(value) {
    const n = parseInt(String(value ?? "0"), 10);
    return Number.isFinite(n) ? n : 0;
}

/**
 * `doSettlement`-ийн хариуг задлана. Амжилт нь зөвхөн `status === true` ба
 * `response_code === "000"` үед. Дүн нь minor unit (x100) тул 100-д хуваана.
 * @returns {{ok: boolean, code: string, msg: string, saleCount?: number,
 *   saleTotal?: number, voidCount?: number, voidTotal?: number}}
 */
export function parseSettlementResponse(data) {
    const resp = data?.response;
    if (data?.status === true && resp) {
        const code = String(resp.response_code ?? "-");
        const msg = String(resp.response_msg ?? "");
        if (code === "000") {
            return {
                ok: true,
                code,
                msg,
                saleCount: toInt(resp.sale_count),
                saleTotal: toInt(resp.sale_total) / 100,
                voidCount: toInt(resp.void_count),
                voidTotal: toInt(resp.void_total) / 100,
            };
        }
        return { ok: false, code, msg };
    }
    if (resp?.Exception) {
        return {
            ok: false,
            code: String(resp.Exception.ErrorCode ?? "-"),
            msg: String(resp.Exception.ErrorMessage ?? ""),
        };
    }
    if (data?.status_code === "ng") {
        return {
            ok: false,
            code: String(data.msg?.code ?? "-"),
            msg: String(data.msg?.body ?? ""),
        };
    }
    return { ok: false, code: "-", msg: "Тооцооны хариу танигдсангүй" };
}

export function describeFailure(result) {
    return `Код: ${result.code}, ${result.msg}`;
}

/**
 * goconnection руу `doSettlement` явуулна. Хэзээ ч throw хийхгүй: холболтын алдаа,
 * HTTP алдаа, timeout-ыг `{ok: false, ...}` болгоно.
 * Timeout (анхдагч 120 сек): goconnection өөрөө 80 секундэд таслдаг тул үүнээс урт
 * хүлээх нь goconnection гацсан гэсэн үг. Эс бөгөөс кассирын дэлгэц хязгааргүй
 * түгжигдэнэ. Timeout болбол автоматаар дахин оролдохгүй: кассир өөрөө шийднэ.
 */
export async function doSettlement(
    headers,
    dbRefNo,
    { url = GO_CONN_URL, fetchImpl = (...args) => fetch(...args), timeoutMs = SETTLEMENT_TIMEOUT_MS } = {}
) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
        const response = await fetchImpl(url, {
            method: "POST",
            headers,
            body: JSON.stringify(buildSettlementBody(dbRefNo)),
            signal: controller ? controller.signal : undefined,
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return parseSettlementResponse(await response.json());
    } catch (error) {
        if (error?.name === "AbortError") {
            return {
                ok: false,
                code: "TIMEOUT",
                msg: `goconnection ${Math.round(timeoutMs / 1000)} секундэд хариу өгсөнгүй. Терминал болон Databank Connection програмыг шалгана уу.`,
            };
        }
        return { ok: false, code: "-", msg: `Алдаа: ${error.message}` };
    } finally {
        if (timer) {
            clearTimeout(timer);
        }
    }
}
