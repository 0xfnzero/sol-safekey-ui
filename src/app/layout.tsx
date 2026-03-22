import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sol SafeKey UI - Solana Wallet Management",
  description: "Complete Solana wallet management tool with advanced security features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
