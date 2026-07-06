import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Titan Sales Manager",
  description: "AI-powered sales call coaching and performance platform — LandPartners Investment Group",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.variable} font-sans h-full bg-[#0d1117] text-[#e6edf3] antialiased`}>
        {children}
      </body>
    </html>
  );
}
