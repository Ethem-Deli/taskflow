import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";

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
      <body className="bg-slate-50 text-slate-900">
        {/* fix 3:
            Wrap the entire app with SessionProvider so useSession()
            works in client components like the dashboard page. */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}