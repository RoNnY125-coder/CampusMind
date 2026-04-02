import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "CampusMind - AI Campus Assistant",
  description: "CampusMind is a modern AI campus assistant for students with personalized onboarding, memory, and chat.",
  keywords: ["CampusMind", "campus assistant", "student AI", "college productivity", "campus chat"],
  openGraph: {
    title: "CampusMind - AI Campus Assistant",
    description: "A clean, fast campus assistant with onboarding, memory, and student-focused chat.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusMind - AI Campus Assistant",
    description: "A clean, fast campus assistant with onboarding, memory, and student-focused chat.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black text-white font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
