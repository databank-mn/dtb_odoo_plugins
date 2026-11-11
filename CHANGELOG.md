# Changelog

All notable changes to the Databank POS plugins. Versions are the `version` key of each module's
`__manifest__.py`. / Модулийн `__manifest__.py` дахь `version`-оор.

## dtb_pos_go_conn_payment 1.1.0 (Odoo 16.0, 17.0, 18.0, 19.0, 20.0) — unreleased

### Added / Нэмсэн
- **Settlement on session close.** Before the POS session is closed, the browser calls Databank Connection
  (`doSettlement`) to close the terminal's batch and stores the counts and totals on the POS session.
  / Session хаахын өмнө терминалын batch-ыг хааж, тоо дүнг session дээр хадгална.
- New payment-method option **Settle on session close** (`go_conn_settle_on_close`).
- Odoo **19.0** and **20.0** branches. Odoo 20 replaced the payment-terminal registration API
  (`payment_provider`, `registry.category("pos_payment_providers")`), so the module is ported, not just updated.
- Store description page documents the settlement option.

### Safety / Аюулгүй байдал, найдвартай байдал
- The option is **opt-in**: `False` for every existing payment method after an upgrade, so closing a session works
  exactly as before until someone turns it on. A fresh install creates the default *Databank Go connection*
  payment method with the option enabled.
- The settlement call has a **120 s timeout** (Databank Connection itself gives up after 80 s), so the screen is never
  locked forever. A failure or timeout asks the cashier whether to close the session anyway.
- An unexpected error in the settlement step never blocks closing the session.
- The existing card **sale** flow is unchanged on 16.0, 17.0 and 18.0.

### Upgrade notes / Шинэчлэлтийн тэмдэглэл
- Upgrade while no POS session is open and reload the POS page afterwards (new JavaScript bundle).
- To use settlement: *Payment Methods → Databank Go connection → Settle on session close*. Databank Connection must be
  running on the cashier PC. Older Databank Connection versions that answer `doSettlement` with a different
  `response_code` than `000` are shown as "not settled" (the session can still be closed).
- Closing the session from the Odoo backend does not trigger a settlement.
- 13.0: no settlement (the Odoo 13 POS UI does not close the session).

## dtb_pos_pass_payment 1.0.2 (Odoo 13.0, 15.0, 16.0) and kb_pos_digi_pay 1.0.2 (Odoo 13.0, 18.0)

### Changed / Өөрчилсөн
- The hard-coded **TEST token** was removed from the code. In TEST mode the token is read from a system parameter:
  - `dtb_pos_pass_payment.test_ecommerce_token`
  - `kb_pos_digi_pay.test_ecommerce_token`

  (*Settings → Technical → System Parameters*). Without it, TEST mode shows "Please set … Ecommerce token!".
  **Production mode is unchanged** (the token of the POS configuration).
- Sample data in code comments was replaced by fictitious values.

### Upgrade notes / Шинэчлэлтийн тэмдэглэл
- If you use TEST mode, set the system parameter above after upgrading.

## dtb_pos_card_payment 1.0.1 (Odoo 13.0, 15.0, 16.0)
- Only sample data in code comments was replaced by fictitious values. No functional change.
