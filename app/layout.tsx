// --- app/layout.tsx (Conceptual Update) ---
import Providers from './providers'; // Import the new provider component
import './globals.css'; // Your global styles

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Wrap children with the Providers component */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}