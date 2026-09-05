import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { AppSessionProvider } from "@/components/session-provider";
import "./globals.css";

/**
 * Sarabun font โหลดผ่าน next/font/google (self-host อัตโนมัติ ไม่ต้องพึ่ง Google CDN ตอน runtime)
 * ผูกเป็น CSS variable --font-sarabun ให้ globals.css ใช้ต่อ
 * น้ำหนัก 300/400/600/700 ครอบคลุมการใช้งานทั่วไป (ปกติ/หนา/หัวข้อ)
 */
const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

/**
 * Favicon: Next.js App Router auto-detect ไฟล์ icon.png / apple-icon.png / favicon.ico
 * ในโฟลเดอร์ app/ อัตโนมัติ ไม่ต้องประกาศ <link rel="icon"> เอง
 */
export const metadata: Metadata = {
  title: "Portfolio Workspace",
  description: "ระบบบริหารพอร์ตโครงการองค์กร",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body>
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
