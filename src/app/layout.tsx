import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AMANA — Décharger. Clarifier. Avancer.",
  description:
    "Partenaire de progression adaptative : dépose ce qui encombre ton esprit, clarifie ce qui compte, avance une action à la fois.",
  applicationName: "AMANA",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "AMANA", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F1E8" },
    { media: "(prefers-color-scheme: dark)", color: "#12100D" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
