odoo.define('dtb_pos_card_payment.PaymentScreen', function(require) {
    "use strict";

    const PaymentScreen = require('point_of_sale.PaymentScreen');
    const Registries = require('point_of_sale.Registries');
    const { onMounted } = owl.hooks;

    const PosDtbCardPaymentScreen = PaymentScreen => class extends PaymentScreen {
        setup() {
        super.setup();
            onMounted(() => {
                const pendingPaymentLine = this.currentOrder.paymentlines.find(
                    paymentLine => paymentLine.payment_method.use_payment_terminal === 'dtb_device_sdk' &&
                        (!paymentLine.is_done() && paymentLine.get_payment_status() !== 'pending')
                );
                if (pendingPaymentLine) {
                    console.log("====DTB card payment line: ", pendingPaymentLine);
                    const paymentTerminal = pendingPaymentLine.payment_method.payment_terminal;
                    paymentTerminal.set_most_recent_service_id(pendingPaymentLine.dtbTerminalServiceId);
                    pendingPaymentLine.set_payment_status('retry');
                }
            });
        }
    };

    Registries.Component.extend(PaymentScreen, PosDtbCardPaymentScreen);

    return PaymentScreen;
});
