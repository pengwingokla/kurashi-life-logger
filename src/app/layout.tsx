import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import "./globals.css";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Matcha Log",
  description: "Track your matcha ritual",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Matcha Log",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${caveat.variable} h-full`}>
      <body className="min-h-full flex flex-col font-caveat bg-white text-black">
        {children}
      </body>
    </html>
  );
}
