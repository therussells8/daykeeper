import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daykeeper · A little more organized",
  description: "Your personal place for tasks, birthdays, and everything coming up.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
