import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "TerràVenda — Gestão de Loteamentos",
  description: "Plataforma inteligente de gestão de loteamentos, cobrança e métricas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark h-full">
      <body className={`${inter.variable} font-sans h-full bg-[#0d1117] text-[#e6edf3] antialiased`}>
        {children}
      </body>
    </html>
  );
}
