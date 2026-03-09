import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Team task management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}