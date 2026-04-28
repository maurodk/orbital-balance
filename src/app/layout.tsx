import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Orbital Balance — Controle Hoje, Liberdade Amanhã",
    template: "%s · Orbital Balance",
  },
  description:
    "Organize suas finanças pessoais com clareza, disciplina e equilíbrio.",
  applicationName: "Orbital Balance",
  icons: {
    icon: "src/assets/icon.ico",
    shortcut: "src/assets/icon.ico",
    apple: "src/assets/icon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1320",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={montserrat.variable} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
