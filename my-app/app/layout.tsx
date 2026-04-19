import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNav } from "@/components/app-nav";
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
        <header className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <AppNav />
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
