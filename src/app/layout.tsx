import type { Metadata } from "next";
import { connection } from "next/server";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "Handled",
  description: "The household home base for bills, documents, renewals, and what's due this week.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The CSP (src/proxy.ts) gives every response a fresh per-request nonce
  // for script-src - which only reaches a page's rendered HTML if that page
  // is dynamically rendered. Forcing dynamic rendering here, once, covers
  // every route (including the few - /, /pricing, /terms, etc. - that would
  // otherwise statically prerender at build time with no nonce available).
  await connection();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
