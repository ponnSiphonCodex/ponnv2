// ต้องเรียกตอน dev เพื่อให้ getCloudflareContext() เข้าถึง D1 binding ได้แม้รันด้วย next dev ธรรมดา
const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
