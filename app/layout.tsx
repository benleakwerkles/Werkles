import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteDescription =
  "Werkles helps builders name what they need, find reachable help, and verify the facts before they rely on anyone.";

export const metadata: Metadata = {
  metadataBase: new URL("https://werkles.com"),
  title: {
    default: "Werkles — Figure out your next step. Build something real.",
    template: "%s | Werkles"
  },
  description: siteDescription,
  openGraph: {
    siteName: "Werkles",
    type: "website",
    title: "Werkles — Figure out your next step. Build something real.",
    description: siteDescription,
    images: [{ url: "/assets/og/werkles-og-card.jpg", width: 1200, height: 630, alt: "Opening day at a new business — Werkles" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Werkles — Figure out your next step. Build something real.",
    description: siteDescription,
    images: ["/assets/og/werkles-og-card.jpg"]
  },
  // Pre-launch: stay out of search indexes until Ben opens that gate.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true
    }
  },
  icons: {
    icon: "/assets/og/werkles-favicon-256.png",
    apple: "/assets/og/werkles-favicon-256.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
