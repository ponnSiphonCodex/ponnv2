import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { RouteLoadingOverlay } from "@/components/loading-overlay";

const sarabun = Sarabun({ subsets: ["thai", "latin"], weight: ["300", "400", "600", "700"], variable: "--font-sarabun", display: "swap" });
// v15 style: ปล่อยให้ Next auto-detect favicon จากไฟล์ app/icon.png + app/favicon.ico (ไม่ประกาศ icons เอง)
export const metadata: Metadata = { title: "Portfolio Workspace" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body>
        {/* Global loading overlay — โผล่อัตโนมัติตอนเปลี่ยนหน้า (เบลอ+block การกด) */}
        <RouteLoadingOverlay />
        {children}
      </body>
    </html>
  );
}
