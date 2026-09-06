# PonnV2 Supabase Data API deployment
1. Rotate all secrets previously shared in chat.
2. In Supabase SQL Editor on a new/empty project, run `database/supabase_schema_seed.sql`.
3. Then run `database/supabase_data_api_setup.sql`.
4. Cloudflare Variables/Secrets required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ALLOWED_DOMAINS, TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID, NEXT_PUBLIC_DRIVE_UPLOAD_URL.
5. Delete DATABASE_URL. It is no longer used.
6. Commit/push, wait for Cloudflare deploy, then open `/api/debug`.
Security: service role key must never be used in a Client Component or exposed to browser code. This implementation creates the client only in server-side DB adapter code.
