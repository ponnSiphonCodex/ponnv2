import type { Metadata } from "next";
import { AppSessionProvider } from "@/components/session-provider";

/**
 * Favicon: Next.js App Router auto-detect ไฟล์ src/app/icon.png,
 * src/app/apple-icon.png, src/app/favicon.ico เป็น metadata route ให้อัตโนมัติ
 * ไม่ต้องประกาศ <link rel="icon"> เอง — แค่มีไฟล์อยู่ในโฟลเดอร์ app/ ก็พอ
 */
export const metadata: Metadata = {
  title: "Portfolio Workspace",
  description: "ระบบบริหารพอร์ตโครงการองค์กร",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body style={{ margin: 0 }}>
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
