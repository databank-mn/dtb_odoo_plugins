# Databank POS plugins for Odoo

Odoo Point of Sale payment plugins by [Databank LLC](https://databank.mn/), for payment terminals and
services used in Mongolia. One git branch per Odoo series: **install the branch that matches your Odoo
version** (the POS JavaScript API differs between Odoo series).

Databank-ийн Odoo POS-ийн төлбөрийн plugin-ууд. Odoo-гийн хувилбар бүрт тусдаа branch байна: **өөрийн
Odoo-гийн хувилбартай таарах branch-ийг** суулгана (Odoo-гийн POS JavaScript API хувилбар бүрд өөр).

## Branches and modules / Branch болон модулиуд

| Branch (Odoo) | `dtb_pos_go_conn_payment` | `dtb_pos_card_payment` | `dtb_pos_pass_payment` | `kb_pos_digi_pay` |
|---|---|---|---|---|
| `13.0` | 1.0.1 | 1.0.1 | 1.0.2 | 1.0.2 |
| `15.0` | n/a | 1.0.1 | 1.0.2 | n/a |
| `16.0` | **1.1.0** | 1.0.1 | 1.0.2 | n/a |
| `17.0` | **1.1.0** | n/a | n/a | n/a |
| `18.0` | **1.1.0** | n/a | n/a | 1.0.2 |
| `19.0` | **1.1.0** | n/a | n/a | n/a |
| `20.0` | **1.1.0** | n/a | n/a | n/a |

Session-closing settlement (see below) is available from `dtb_pos_go_conn_payment` **1.1.0** on Odoo
16.0, 17.0, 18.0, 19.0 and 20.0. The 13.0 branch has no settlement: the Odoo 13 POS UI never closes the
session, it only leaves the page.

## Modules / Модулиуд

| Module | Payment method it adds | What it does |
|---|---|---|
| `dtb_pos_go_conn_payment` | *Databank Go connection* | Card payments through a PIN-pad using the Databank Connection ("goconnection") program running on the cashier PC. The browser talks to `http://localhost:27028`. |
| `dtb_pos_card_payment` | *Databank SDK* | Card payments through the Databank ePOS Android terminal app (the POS page opens a `dtbodoo://` link handled by the app). |
| `dtb_pos_pass_payment` | *PASS* | PASS QR code payments. |
| `kb_pos_digi_pay` | *DigiPay* | DigiPay QR code payments. |

## Requirements / Шаардлага

- Odoo of the series that matches the branch, with the **Point of Sale** app.
  / Branch-тай таарах хувилбарын Odoo, **Point of Sale** апп.
- `dtb_pos_go_conn_payment`: the **Databank Connection** ("goconnection") program from Databank LLC runs on the
  cashier PC and a PIN-pad terminal is connected to it. The program is not part of this repository.
  / Кассын компьютер дээр Databank LLC-ийн **Databank Connection** програм ажиллаж, PIN-pad терминал холбогдсон
  байна. Програм энэ repository-д ороогүй.
- `dtb_pos_card_payment`: the Databank ePOS Android terminal app is installed on the device that opens the POS page.
  / POS хуудсыг нээж буй төхөөрөмж дээр Databank ePOS Android апп суусан байна.
- `dtb_pos_pass_payment`, `kb_pos_digi_pay`: the **Odoo server** calls the PASS API (`https://ecom.pass.mn/`), so it
  needs internet access to it. Production use needs the *Ecommerce token* issued by Databank LLC.
  / **Odoo server** PASS API (`https://ecom.pass.mn/`)-г дууддаг тул тэр рүү интернэт холболттой байх ёстой.
  Бодитоор ашиглахад DATABANK ХХК-аас өгсөн *Ecommerce token* хэрэгтэй.

## Installation / Суулгах

Install from the Odoo Apps store, or copy the module folders of your branch into your Odoo addons path, update
the apps list and install the module. Then configure it as described for the module below.

Odoo Apps store-оос суулгана, эсвэл өөрийн хувилбарын branch-ийн модулийн хавтсуудыг Odoo-гийн addons path руу
хуулж, Apps list-ээ шинэчлээд модулийг суулгана. Дараа нь доорх модулийн заавраар тохируулна.

## Setup and usage / Тохиргоо ба хэрэглээ

### `dtb_pos_go_conn_payment`: PIN-pad card payments / PIN-pad-ээр картын төлбөр

**Setup / Тохиргоо**

1. Install the module (Apps → search *POS Go Conn payment*).
   / Apps дотроос *POS Go Conn payment* гэж хайж суулгана.
2. Open *Point of Sale → Configuration → Payment Methods → Databank Go connection* (created on install) and
   select a bank **Journal**. Check that the terminal field (*Use a Payment Terminal*; on Odoo 20.0 the payment
   provider) is **Databank Go connection**.
   / Суулгахад үүссэн *Databank Go connection* төлбөрийн аргыг нээж банкны **Journal** сонгоно. Терминалын талбар
   (*Use a Payment Terminal*; Odoo 20.0 дээр payment provider) дээр **Databank Go connection** сонгогдсон эсэхийг
   шалгана.
3. Databank Connection must be running on the cashier PC.
   / Кассын компьютер дээр Databank Connection ажиллаж байх ёстой.

**Usage / Хэрэглэх**

1. Enter the order and, on the payment screen, click **Send** on the *Databank Go connection* line: the card-read
   command is sent to the PIN-pad.
   / Захиалгаа бичээд төлбөрийн дэлгэц дээрх *Databank Go connection* мөрийн **Send** товчийг дарахад PIN-pad
   төхөөрөмж рүү карт уншуулах команд илгээгдэнэ.
2. After the payment the line shows **Payment successful** and **VALIDATE** becomes active: finish the order.
   / Төлбөр хийгдсэний дараа **Payment successful** төлөв орж **VALIDATE** товч идэвхжинэ: захиалгаа дуусгана.

Card entry modes as listed on the module's store page: magstripe, chip (ICC), contactless, PASS QR (MPM).
/ Store хуудсанд дурдсан горим: Magstripe, ICC (чип), Contactless, PASS QR (MPM).

Closing the session can also settle the terminal's batch: see *Settlement on session close* below.
/ Session хаахад терминалын тооцоог хаах боломж: доорх *Settlement on session close*-г үзнэ үү.

### `dtb_pos_pass_payment`: PASS QR payments / PASS QR төлбөр

**Setup / Тохиргоо**

1. Install the module (Apps → search *Pass*).
   / Apps дотроос *Pass* гэж хайж суулгана.
2. Open *Point of Sale → Configuration → Payment Methods → PASS* (created on install), select a bank **Journal**
   and check that the terminal field is **PASS payment**.
   / Суулгахад үүссэн *PASS* төлбөрийн аргыг нээж банкны **Journal** сонгоно; терминалын талбар дээр
   **PASS payment** сонгогдсон эсэхийг шалгана.
3. Production: enter the token issued by Databank LLC in the **Pass Ecommerce Token** field of the POS settings
   (on 13.0 and 15.0 it is on the POS configuration form). The PASS API URLs are in the *PASS integration info*
   block of the settings; the defaults are pre-filled.
   / Бодитоор ашиглахад **Pass Ecommerce Token** талбарт DATABANK ХХК-аас өгсөн token-г бөглөнө (POS-ийн
   тохиргоо; 13.0, 15.0 дээр POS-ийн configuration form дээр). PASS-ийн API хаягууд тохиргооны *PASS integration
   info* хэсэгт анхдагч утгатай байна.
4. Test mode (optional; the option is visible in developer mode only): enable **Active pass test mode** on the
   payment method. The module then uses the PASS staging host (`ecomstg.pass.mn`) and reads the TEST token from the
   system parameter `dtb_pos_pass_payment.test_ecommerce_token` (*Settings → Technical → System Parameters*). The
   TEST token is not part of this repository; without the parameter the POS shows "Please set Pass Ecommerce
   token!". Do not enable test mode in production.
   / Тест горим (сонголтоор; зөвхөн developer mode дээр харагдана): төлбөрийн арга дээр **Active pass test mode**-ыг
   сонгоно. Энэ үед модуль PASS-ийн stage хаяг (`ecomstg.pass.mn`)-ыг ашиглаж, TEST token-г *Settings → Technical →
   System Parameters* дахь `dtb_pos_pass_payment.test_ecommerce_token` түлхүүрээс авна. TEST token энэ
   repository-д ороогүй; тохируулаагүй бол POS дээр "Please set Pass Ecommerce token!" гэж гарна. Бодит
   ажиллагаанд тест горимыг асаахгүй.

**Usage / Хэрэглэх**

1. On the payment screen click **Send** on the *PASS* line: a QR code appears. Scan it with the PASS app.
   / Төлбөрийн дэлгэц дээрх *PASS* мөрийн **Send** товчийг дарахад QR код гарч ирнэ. PASS апп-аар уншуулна.
2. After the payment the QR window closes, the line shows **Payment successful** and **VALIDATE** becomes active.
   / Төлбөр хийгдсэний дараа QR цонх хаагдаж, **Payment successful** төлөв орж **VALIDATE** товч идэвхжинэ.

### `kb_pos_digi_pay`: DigiPay QR payments / DigiPay QR төлбөр

**Setup / Тохиргоо**

1. Install the module (Apps → search *DigiPay*).
   / Apps дотроос *DigiPay* гэж хайж суулгана.
2. Open *Point of Sale → Configuration → Payment Methods → DigiPay* (created on install), select a bank **Journal**
   and check that the terminal field is **DigiPay**.
   / Суулгахад үүссэн *DigiPay* төлбөрийн аргыг нээж банкны **Journal** сонгоно; терминалын талбар дээр
   **DigiPay** сонгогдсон эсэхийг шалгана.
3. Production: enter the token issued by Databank LLC in the **DigiPay Ecommerce Token** field of the POS
   configuration. The API URLs are in the *DigiPay info* block of the Point of Sale settings; the defaults are
   pre-filled.
   / Бодитоор ашиглахад POS-ийн тохиргооны **DigiPay Ecommerce Token** талбарт DATABANK ХХК-аас өгсөн token-г
   бөглөнө. API хаягууд Point of Sale тохиргооны *DigiPay info* хэсэгт анхдагч утгатай байна.
4. Test mode (optional; the option is visible in developer mode only): enable **Active DigiPay test mode** on the
   payment method. The module then uses the staging host (`ecomstg.pass.mn`) and reads the TEST token from the system
   parameter `kb_pos_digi_pay.test_ecommerce_token`. The TEST token is not part of this repository; without the
   parameter the POS shows "Please set DigiPay Ecommerce token!". Do not enable test mode in production.
   / Тест горим (сонголтоор; зөвхөн developer mode дээр харагдана): төлбөрийн арга дээр **Active DigiPay test
   mode**-ыг сонгоно. Энэ үед модуль stage хаяг (`ecomstg.pass.mn`)-ыг ашиглаж, TEST token-г
   `kb_pos_digi_pay.test_ecommerce_token` system parameter-ээс авна. TEST token энэ repository-д ороогүй;
   тохируулаагүй бол POS дээр "Please set DigiPay Ecommerce token!" гэж гарна. Бодит ажиллагаанд тест горимыг
   асаахгүй.

**Usage / Хэрэглэх**

1. On the payment screen click **Send** on the *DigiPay* line: a QR code appears. Scan it with the DigiPay app.
   / Төлбөрийн дэлгэц дээрх *DigiPay* мөрийн **Send** товчийг дарахад QR код гарч ирнэ. DigiPay апп-аар уншуулна.
2. After the payment the QR window closes, the line shows **Payment successful** and **VALIDATE** becomes active.
   / Төлбөр хийгдсэний дараа QR цонх хаагдаж, **Payment successful** төлөв орж **VALIDATE** товч идэвхжинэ.

### `dtb_pos_card_payment`: Databank ePOS Android app / Databank ePOS Android апп

1. Install the module (Apps → search *POS card payment*). The payment method **Databank SDK** is created: select a
   bank **Journal** as for any Odoo payment method.
   / Apps дотроос *POS card payment* гэж хайж суулгана. **Databank SDK** төлбөрийн арга үүснэ: бусад төлбөрийн
   аргын адил банкны **Journal** сонгоно.
2. When the cashier clicks **Send**, the POS page opens a `dtbodoo://pos.payment.databank.mn/?amount=AMOUNT&db_ref_no=REF`
   link. The Databank ePOS Android app on the same device handles it and performs the card transaction.
   / Кассир **Send** дарахад POS хуудас `dtbodoo://pos.payment.databank.mn/?amount=AMOUNT&db_ref_no=REF` холбоосыг
   нээнэ. Тэр төхөөрөмж дээрх Databank ePOS Android апп үүнийг хүлээн авч картын гүйлгээг хийнэ.

## Settlement on session close (`dtb_pos_go_conn_payment` 1.1.0)

When the cashier closes the POS session, the browser can ask Databank Connection (`doSettlement`) to close the
terminal's batch first.

- **Off by default for existing installations.** Upgrading does not change how sessions are closed. Enable it per
  payment method: *Payment Methods → Databank Go connection → Settle on session close*. On a **fresh** install the
  default *Databank Go connection* payment method is created with the option enabled.
- Databank Connection must be running on the cashier PC and the terminal ready.
- If the settlement fails, or gets no answer within 120 seconds, the cashier sees "Тооцоо хаагдсангүй" and can
  still close the session anyway; the session closing is never blocked by a problem of this step.
- On success the transaction counts and totals are stored on the POS session (fields `go_conn_*`).
- Closing the session from the Odoo **backend** does not trigger a settlement (only closing it in the POS does).

Session хаахад терминалын тооцоог (batch) Databank Connection-ээр хаах боломжтой. Хуучин суулгацад **анхдагчаар
унтраалттай**, шинэчлэлийн дараа ажиллагаа өөрчлөгдөхгүй; төлбөрийн арга бүр дээр *Settle on session close*
сонголтоор асаана. Алдаа гарвал эсвэл 120 секундэд хариу ирэхгүй бол session-ийг ямартай ч хаах боломжтой.

## Changes and upgrade notes / Өөрчлөлт

See [CHANGELOG.md](CHANGELOG.md).

## License / Лиценз

See the `license` key of each module's `__manifest__.py` and the license file of this repository.
