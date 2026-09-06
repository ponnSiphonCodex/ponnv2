# Critical fix: statement type is not allowed
Root cause: v2 used `\b` as a regex word-boundary. PostgreSQL regex does not treat `\b` as a word-boundary, so SELECT/INSERT/UPDATE/DELETE were rejected.

## Install
1. Supabase > SQL Editor > New query.
2. Paste all of `database/supabase_data_api_setup_v3.sql`.
3. Click Run. `CREATE OR REPLACE FUNCTION` upgrades the existing function; no table/data deletion.
4. Confirm the two smoke-test rows appear without error.
5. Deploy this code ZIP to Cloudflare.
6. Open `/api/debug`; expected `db.ok: true`.
7. Test Google login, then local login.

No schema reset is needed. Do not run DROP SCHEMA.
