import type { Metadata } from "next";
// @ts-expect-error Next.js handles this stylesheet import at runtime.
import "./globals.css";

export const metadata: Metadata = {
  title: "Dictionary Tier List",
  description: "Mattrs special",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
