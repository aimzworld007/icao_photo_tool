import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'UAE Identity Photo Check',
  description: 'Professional ICAO Doc 9303 photograph compliance analysis and facial biometric recognition and identity verification platform.',
  manifest: '/manifest.json',
  themeColor: '#0ea5e9',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
