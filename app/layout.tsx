import type { Metadata } from "next";
import { Fraunces, Karla, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import DatabaseProvider from "@/components/DatabaseProvider";
import VersionBadge from "@/components/VersionBadge";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Shoplift — General Store",
  description: "A tiny storefront you stock yourself. Powered by Convex.",
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${karla.variable} ${plexMono.variable} antialiased`}
      >
        <DatabaseProvider>
          {children}
          <VersionBadge />
        </DatabaseProvider>
      </body>
    </html>
  );
}
