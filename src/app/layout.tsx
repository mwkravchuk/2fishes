import type { Metadata } from "next";
import { Average } from "next/font/google";
import "./globals.css";

const average = Average({
  variable: "--font-display",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "2fishes",
  description: "Small batch coffee roasters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${average.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
