import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Matkassen – din egen matkasse",
  description:
    "Få fem middagsförslag, byt ut de du inte gillar och lägg alla ingredienser direkt i varukorgen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span aria-hidden>🥕</span> Matkassen
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href="/" className="text-stone-600 hover:text-stone-900">
                Veckans förslag
              </Link>
              <Link
                href="/varukorg"
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-white hover:bg-emerald-700"
              >
                🛒 Varukorg
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
          Matkassen – bygg din egen matkasse. Priser från inbyggd demokatalog.
        </footer>
      </body>
    </html>
  );
}
