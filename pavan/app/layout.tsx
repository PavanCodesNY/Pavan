import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Shell } from "./components/Shell";

const display = localFont({
  src: [
    {
      path: "../public/fonts/ClashDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/ClashDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/ClashDisplay-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

const body = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pavan Kumar",
  description:
    "18. Building Clean, the shared context intelligence layer for AI Agents.",
  openGraph: {
    title: "Pavan Kumar",
    description: "18. Building Clean.",
    type: "website",
  },
  twitter: { card: "summary" },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
