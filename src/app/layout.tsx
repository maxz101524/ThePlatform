import type { Metadata } from "next";
import { Inter, Barlow_Condensed, JetBrains_Mono, Lexend } from "next/font/google";
import { TopNav } from "@/components/nav/top-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "The Platform — Powerlifting Hub",
  description: "Rankings, athlete profiles, meet results, and community for powerlifting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlow.variable} ${jetbrains.variable} ${lexend.variable}`}>
      <body className="bg-bg-dark text-text-secondary font-body antialiased">
        <TopNav />
        <main className="mx-auto max-w-7xl px-4 pb-20 pt-4 md:pb-6">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
