import type { Metadata } from "next";
import { AppSessionProvider } from "@/components/session-provider";

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
