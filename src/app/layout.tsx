import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "AI Storybook",
  description: "AI Storybook: The open source version of gemini storybook",
  icons: {
    icon: "/images/fav.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Fixed Logo in top left */}
        <div className="fixed-logo">
          <img
            src="/images/dark.svg"
            alt="AI Storybook Logo"
            className="logo-svg"
          />
        </div>
        {children}
      </body>
    </html>
  );
}
