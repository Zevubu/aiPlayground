import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Playground",
  description: "Local OpenAI-compatible chat for testing and troubleshooting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="shrink-0 border-b border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
          <nav className="flex gap-6 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Link href="/" className="hover:text-zinc-950 dark:hover:text-zinc-50">
              Chat
            </Link>
            <Link href="/compare" className="hover:text-zinc-950 dark:hover:text-zinc-50">
              Compare
            </Link>
          </nav>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
