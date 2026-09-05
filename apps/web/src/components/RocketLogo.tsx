/**
 * apps/web/src/components/RocketLogo.tsx
 * โลโก้จรวด — ใช้แทนไอคอนบ้านเดิมทั้งหน้า Login และหัวข้อระบบ
 * เวกเตอร์ล้วน ไม่ต้องพึ่งไฟล์รูปภาพภายนอก ปรับขนาดได้ผ่าน prop size
 */
export function RocketLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(45 32 32)">
        {/* ลำตัวจรวด */}
        <path
          d="M32 4C39 11 40 24 40 40H24C24 24 25 11 32 4Z"
          fill="#E5E9EF"
        />
        {/* จมูกจรวดสีแดง */}
        <path d="M32 4C35.5 8 37.5 13.5 38 19H26C26.5 13.5 28.5 8 32 4Z" fill="#EC186E" />
        {/* หน้าต่างจรวด */}
        <circle cx="32" cy="25" r="5" fill="#001D58" />
        <circle cx="32" cy="25" r="2.6" fill="#8ECBEE" />
        {/* ครีบซ้าย-ขวา */}
        <path d="M24 30L13 43L24 40.5V30Z" fill="#EC186E" />
        <path d="M40 30L51 43L40 40.5V30Z" fill="#EC186E" />
        {/* ฐานจรวด */}
        <rect x="26" y="38" width="12" height="4" rx="1" fill="#C7CDD6" />
        {/* เปลวไฟ */}
        <path d="M27.5 42L32 57L36.5 42L32 47.5L27.5 42Z" fill="#F5B301" />
      </g>
    </svg>
  );
}
