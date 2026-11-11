// goconnection-тэй харилцахад хэрэгтэй туслахууд (20.0).

// goconnection руу явуулах header. Хувилбар унших нь амжилтгүй бол (жишээ нь эрх, сүлжээ)
// төлбөр/тооцоог блоклохгүй, хувилбарыг "-" гэж явуулна.
// 20.0: `rpc` import-ийг ашиглахгүй, баталгаажсан `pos.data.silentCall`-аар дуудна.
export async function getGoConnHeaders(pos) {
    let version = "-";
    try {
        const result = await pos.data.silentCall("ir.module.module", "get_module_full_version", [
            "dtb_pos_go_conn_payment",
        ]);
        if (typeof result === "string" && result) {
            version = result;
        }
    } catch (error) {
        console.warn("Go conn: module version unavailable", error);
    }
    return {
        "content-type": "application/json",
        msp_program_name: "Odoo ERP, dtb_pos_go_conn_payment: " + version,
        "Access-Control-Allow-Origin": "*",
    };
}

// Карт унших / тооцоо хаах хугацаанд дэлгэцийг түгжинэ.
export function lockUi(message) {
    unlockUi();

    const overlay = document.createElement("div");
    overlay.id = "uiLockId";
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1000;
        opacity: 0.6;
        width: 100%;
        height: 100%;
        color: white;
        background-color: black;
    `;
    document.body.appendChild(overlay);

    const messageDiv = document.createElement("div");
    messageDiv.id = "countdown_div";
    messageDiv.style.cssText = `
        position: absolute;
        top: 35%;
        left: 30%;
        width: 570px;
        border: 3px solid #33b5e5;
        padding: 10px;
        color: white;
        font-family: tahoma;
        font-weight: bold;
        font-size: 25px;
        z-index: 5000;
        opacity: 0.8;
        background-color: black;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
}

export function unlockUi() {
    document.getElementById("uiLockId")?.remove();
    document.getElementById("countdown_div")?.remove();
}
