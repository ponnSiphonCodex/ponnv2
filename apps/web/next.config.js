// ต้องเรียกตอน dev (npm run dev / next dev) เพื่อให้ getCloudflareContext()
// เข้าถึง D1 binding (mock ผ่าน wrangler local persistence) ได้แม้รันด้วย next dev
// ธรรมดา ไม่ต้องผ่าน `wrangler dev` — ดู https://opennext.js.org/cloudflare/get-started
const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
