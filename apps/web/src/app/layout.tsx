import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({ subsets: ["thai", "latin"], weight: ["300", "400", "600", "700"], variable: "--font-sarabun", display: "swap" });

// favicon เสิร์ฟจาก public/ (path ตรง) — ประกาศชัดเจนใน metadata + middleware ไม่บล็อกไฟล์ .ico/.png
export const metadata: Metadata = {
  title: "Portfolio Workspace",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/apple-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body>{children}</body>
    </html>
  );
}
