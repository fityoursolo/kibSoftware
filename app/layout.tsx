// app/layout.tsx
// import type { Metadata } from "next";
import "./globals.css";
// Use NAMED IMPORT:
import { Providers } from "./provider"; 

// The default export is RootLayout, a valid Server Component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}