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

## Modules

| Module | What it does |
|---|---|
| `dtb_pos_go_conn_payment` | Card payments through a PIN-pad using the Databank Connection ("goconnection") program running on the cashier PC. The browser talks to `http://localhost:27028`. |
| `dtb_pos_card_payment` | Card payments through the Databank ePOS Android terminal app (the POS page opens a `dtbodoo://` link handled by the app). |
| `dtb_pos_pass_payment` | PASS QR code payments. |
| `kb_pos_digi_pay` | DigiPay QR code payments. |

## Installation

Install from the Odoo Apps store or copy the module folders of your branch into your Odoo addons path, update
the apps list and install the module. After installing `dtb_pos_go_conn_payment`, open
*Point of Sale → Configuration → Payment Methods → Databank Go connection* and select a bank journal.

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
