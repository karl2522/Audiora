import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { MusicPlayerProvider } from "@/contexts/music-player-context";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Audiora",
  description: "Your AI-powered music DJ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <MusicPlayerProvider>
            {children}
          </MusicPlayerProvider>
        </AuthProvider>
        <Toaster 
          position="bottom-right" 
          richColors 
          className={`${geistSans.variable} ${geistMono.variable}`}
          toastOptions={{
            style: {
              fontFamily: '"Geist", "Geist Fallback", sans-serif',
            },
          }}
        />
      </body>
    </html>
  );
}
