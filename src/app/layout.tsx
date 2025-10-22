import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/naviagtion/Navigation";
import { NotificationProvider, TransactionPopupProvider } from '@blockscout/app-sdk'
import '@blockscout/app-sdk/dist/style.css'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WorkPassport",
  description: "Verifiable credentials for remote workers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-bg-primary">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NotificationProvider>
          <TransactionPopupProvider>
            <Navigation/>
            {children}
          </TransactionPopupProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}