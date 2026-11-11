/** @odoo-module */

// import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
// import { patch } from "@web/core/utils/patch";
// import { onMounted } from "@odoo/owl";

// patch(PaymentScreen.prototype, {
//     setup() {
//         super.setup(...arguments);
//         onMounted(() => {
//             console.log("PaymentScreen dtb");
//             const pendingPaymentLine = this.currentOrder.paymentlines.find(
//                 (paymentLine) =>
//                     paymentLine.payment_method.use_payment_terminal === "dtb_go_conn" &&
//                     !paymentLine.is_done() &&
//                     paymentLine.get_payment_status() !== "pending"
//             );
//             if (pendingPaymentLine) {
//                 const paymentTerminal = pendingPaymentLine.payment_method.payment_terminal;
//                 paymentTerminal.set_most_recent_service_id(pendingPaymentLine.terminalServiceId);
//                 pendingPaymentLine.set_payment_status('retry');
//                 pendingPaymentLine.can_be_reversed = false;
//             }
//             console.log("==pendingPaymentLine", pendingPaymentLine);
//         });
//     },
// });