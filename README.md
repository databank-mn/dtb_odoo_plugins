# Databank POS plugins for Odoo

Odoo Point of Sale payment plugins by [Databank LLC](https://databank.mn/), for payment terminals and
services used in Mongolia.

Databank-ийн Odoo POS-ийн төлбөрийн plugin-ууд: Монголд хэрэглэгддэг төлбөрийн терминал, үйлчилгээнд зориулсан.

> **The `master` branch has no code: it only holds this overview.** The code lives in one branch per Odoo
> series. **Pick the branch that matches your Odoo version** (the POS JavaScript API differs between series).
>
> **`master` branch-д код байхгүй, зөвхөн энэ танилцуулга байна.** Код нь Odoo-гийн хувилбар бүрт тусдаа branch-д
> байна. **Өөрийн Odoo-гийн хувилбартай таарах branch-ийг** сонгоно (Odoo-гийн POS JavaScript API хувилбар бүрд өөр).

## Branches and modules / Branch болон модулиуд

| Odoo | Branch | `dtb_pos_go_conn_payment` | `dtb_pos_card_payment` | `dtb_pos_pass_payment` | `kb_pos_digi_pay` |
|---|---|---|---|---|---|
| 13.0 | [`13.0`](https://github.com/databank-mn/dtb_odoo_plugins/tree/13.0) | 1.0.1 | 1.0.1 | 1.0.2 | 1.0.2 |
| 15.0 | [`15.0`](https://github.com/databank-mn/dtb_odoo_plugins/tree/15.0) | n/a | 1.0.1 | 1.0.2 | n/a |
| 16.0 | [`16.0`](https://github.com/databank-mn/dtb_odoo_plugins/tree/16.0) | **1.1.0** | 1.0.1 | 1.0.2 | n/a |
| 17.0 | [`17.0`](https://github.com/databank-mn/dtb_odoo_plugins/tree/17.0) | **1.1.0** | n/a | n/a | n/a |
| 18.0 | [`18.0`](https://github.com/databank-mn/dtb_odoo_plugins/tree/18.0) | **1.1.0** | n/a | n/a | 1.0.2 |
| 19.0 | [`19.0`](https://github.com/databank-mn/dtb_odoo_plugins/tree/19.0) | **1.1.0** | n/a | n/a | n/a |
| 20.0 | [`20.0`](https://github.com/databank-mn/dtb_odoo_plugins/tree/20.0) | **1.1.0** | n/a | n/a | n/a |

`n/a`: the module does not exist for that Odoo series. / `n/a`: тухайн Odoo-гийн хувилбарт модуль байхгүй.

## Modules / Модулиуд

| Module | What it does / Юу хийдэг |
|---|---|
| `dtb_pos_go_conn_payment` | Card payments through a PIN-pad using the Databank Connection ("goconnection") program running on the cashier PC. From 1.1.0 (Odoo 16.0 and newer) it can also settle the terminal's batch when the POS session is closed. / Кассын компьютер дээр ажиллах Databank Connection ("goconnection") програмаар PIN-pad төхөөрөмжөөр картын төлбөр хийнэ. 1.1.0-ээс (Odoo 16.0 ба түүнээс дээш) session хаахад терминалын тооцоог хаах боломжтой. |
| `dtb_pos_card_payment` | Card payments through the Databank ePOS Android terminal app. / Databank ePOS Android апп-аар картын төлбөр хийнэ. |
| `dtb_pos_pass_payment` | PASS QR code payments. / PASS QR кодоор төлбөр хийнэ. |
| `kb_pos_digi_pay` | DigiPay QR code payments. / DigiPay QR кодоор төлбөр хийнэ. |

## Get the code / Код авах

1. Open the branch of your Odoo series (table above).
   / Өөрийн Odoo-гийн хувилбарын branch-ийг нээнэ (дээрх хүснэгт).
2. Download it (*Code → Download ZIP*) or clone only that branch, for example for Odoo 18.0:
   / ZIP-ээр татна (*Code → Download ZIP*) эсвэл зөвхөн тэр branch-ийг clone хийнэ, жишээ нь Odoo 18.0:

   ```bash
   git clone --branch 18.0 --single-branch https://github.com/databank-mn/dtb_odoo_plugins.git
   ```

3. Copy the module folders into your Odoo addons path, update the apps list and install the module. You can also
   install from the Odoo Apps store.
   / Модулийн хавтсуудыг Odoo-гийн addons path руу хуулж, Apps list-ээ шинэчлээд модулийг суулгана. Odoo Apps
   store-оос ч суулгаж болно.

The README of each branch describes the requirements (for example the Databank Connection program for
`dtb_pos_go_conn_payment`), the setup and the usage of every module in that branch.
/ Branch бүрийн README-д тухайн branch дахь модуль бүрийн шаардлага (жишээ нь `dtb_pos_go_conn_payment`-д Databank
Connection програм), тохиргоо, хэрэглээг тайлбарласан.

## Changes / Өөрчлөлт

Each branch has its own `CHANGELOG.md`. / Branch бүр өөрийн `CHANGELOG.md`-тэй.

## License / Лиценз

See the `license` key of each module's `__manifest__.py` in the branch.
/ Branch доторх модуль бүрийн `__manifest__.py` дахь `license` түлхүүрийг үзнэ үү.
