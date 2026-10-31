import type { Metadata, Viewport } from "next";
import { launchColors } from "@/domain/pwa";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elleboro Giardini",
  description: "Elleboro Giardini.",
  applicationName: "Elleboro",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Elleboro",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/icons/tab.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

const colors = launchColors();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: colors.light },
    { media: "(prefers-color-scheme: dark)", color: colors.dark },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${bricolage.variable} h-full`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
