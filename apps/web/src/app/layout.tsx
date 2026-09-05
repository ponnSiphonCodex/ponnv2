import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
const sarabun = Sarabun({ subsets: ["thai", "latin"], weight: ["300", "400", "600", "700"], variable: "--font-sarabun", display: "swap" });
export const metadata: Metadata = { title: "Portfolio Workspace" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="th" className={sarabun.variable}><body>{children}</body></html>);
}
