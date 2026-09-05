import type { Metadata } from "next";
import { AppSessionProvider } from "@/components/session-provider";

export const metadata: Metadata = { title: "PM Platform", description: "Enterprise Project Management & Portfolio" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
