import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'ICAO Photo Verification & KYC Suite',
  description: 'Professional ICAO Doc 9303 photograph compliance analysis and facial biometric recognition and identity verification platform.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
