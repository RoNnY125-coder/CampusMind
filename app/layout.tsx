import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "CampusMind — AI Campus Assistant",
    description:
        "Your AI campus assistant that remembers you. Powered by Hindsight memory.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="antialiased">{children}</body>
        </html>
    );
}
