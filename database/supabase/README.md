# Supabase Migration
1. Rotate every secret shared in chat.
2. Run `01_schema_and_seed.sql` in Supabase SQL Editor on a new/empty project.
3. Run `02_verify.sql`.
4. Set Cloudflare secrets: `DATABASE_URL`, `AUTH_SECRET`, Google credentials, Telegram credentials.
5. Use transaction pooler port 6543. The PostgreSQL client sets `prepare:false` for pooler compatibility.
6. Deploy and test `/api/debug`, Google login, CRUD, meetings, files, admin approval, reports.
