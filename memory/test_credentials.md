# Test Credentials — SR Rénovation

## App access (PIN)
- PIN code: `0330`
- Playwright bypass (recommended): `page.add_init_script("localStorage.setItem('sr_auth','true');")` BEFORE first navigation, OR fill the 4 inputs `data-testid=pin-digit-0..3` with `0330`.

## Email (testing only)
- ONLY use `rubensrzs03@gmail.com` for any email test.
- 🚨 NEVER send test emails to real clients in the DB.

## Notes
- DB contains REAL clients/quotes. Do not mutate real client notes without restoring them.
