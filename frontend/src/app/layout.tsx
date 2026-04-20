/**
 * =============================================================================
 * SMARTCAREER AI - Root Layout
 * =============================================================================
 */

import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "./globals.css";

const frontendBaseUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.trim() || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(frontendBaseUrl),
  title: {
    default: "SmartCareer AI - AI-Powered Career Platform",
    template: "%s | SmartCareer AI",
  },
  description:
    "Build stunning resumes with AI, find your dream job, and accelerate your career with SmartCareer AI.",
  keywords: [
    "AI resume builder",
    "job search",
    "career platform",
    "resume generator",
    "job matching",
    "career development",
  ],
  authors: [{ name: "SmartCareer AI Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://smartcareer.ai",
    siteName: "SmartCareer AI",
    title: "SmartCareer AI - AI-Powered Career Platform",
    description: "Build stunning resumes with AI and find your dream job.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SmartCareer AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartCareer AI",
    description: "Build stunning resumes with AI and find your dream job.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#06b6d4" />
      </head>
      <body className="min-h-screen bg-white dark:bg-surface-950">
        <Providers>
          {children}
        </Providers>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
            },
            className: "font-sans",
          }}
        />
      </body>
    </html>
  );
}



