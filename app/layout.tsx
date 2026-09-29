import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Morning Passage",
    template: "%s · Morning Passage",
  },
  description: "A quiet morning Bible passage in English, one reading for each day.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sourceSans.variable}`}>
      <body>
        <a className="skip-link" href="#passage">
          Skip to today’s reading
        </a>
        <div className="sky" aria-hidden="true" />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
