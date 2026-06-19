# Test Credentials — SR Rénovation

## App access (PIN)
- PIN code: `033003` (6 chiffres, renforcé — juin 2026)
- Playwright: fill the 6 inputs `data-testid=pin-digit-0..5` with `0`,`3`,`3`,`0`,`0`,`3` (focus first input, then keyboard.press each digit). localStorage `sr_auth='true'` bypass may not persist via the screenshot tool.

## Email (testing only)
- ONLY use `rubensrzs03@gmail.com` for any email test.
- 🚨 NEVER send test emails to real clients in the DB.

## Notes
- DB contains REAL clients/quotes. Do not mutate real client notes without restoring them.
