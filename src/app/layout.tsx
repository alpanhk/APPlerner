import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lernen — Belajar Bahasa Jerman lewat Cerita",
  description: "Novel visual untuk belajar bahasa Jerman A1: satu kota, satu surat, dan tiga belas bab yang semuanya mengajar dengan pola yang sama.",
};

export const viewport: Viewport = {
  themeColor: "#222a3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800&display=swap"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
