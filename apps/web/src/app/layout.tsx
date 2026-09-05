import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

// ★ ประกาศ icons แบบชัดเจน (นอกจากไฟล์ icon.png/favicon.ico ที่ Next auto-detect)
// เพื่อให้ browser เจอ favicon แน่นอนแม้ auto-detect จะเพี้ยน
export const metadata: Metadata = {
  title: "Portfolio Workspace",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body>{children}</body>
    </html>
  );
}
