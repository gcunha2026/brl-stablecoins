import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fintrender | BRL Stablecoins Dashboard",
  description:
    "Real-time analytics dashboard for Brazilian Real (BRL) stablecoins - supply, volume, chains, and DeFi pools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-primary text-text-primary`}>
        <div className="flex min-h-screen">
          <Sidebar />
          {/* Main content area with left margin for sidebar */}
          <div className="flex-1 ml-56">
            <Header />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
