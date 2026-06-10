import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const viewport = {
  themeColor: '#0ea5e9',
};

export const metadata: Metadata = {
  title: 'UAE Identity Photo Check | ICAO Compliant',
  description: 'Instantly verify photo compliance for Emirates ID and UAE Residency. Professional ICAO Doc 9303 analysis, facial biometric recognition, and KYC identity verification platform.',
  keywords: 'Emirates ID photo, UAE residency photo, ICAO photo check, biometric photo validation, UAE visa photo, passport photo checker',
  manifest: '/manifest.json',
  openGraph: {
    title: 'UAE Identity Photo Check',
    description: 'Instantly verify photo compliance for Emirates ID and UAE Residency.',
    url: 'https://ais-pre-uht5befrmkutpmkwfiy6dh-177507000112.asia-southeast1.run.app',
    siteName: 'UAE Identity Photo Check',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'UAE Identity Photo Check Presentation',
      },
    ],
    locale: 'en_AE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UAE Identity Photo Check',
    description: 'Instantly verify photo compliance for Emirates ID and UAE Residency processing.',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UAE ID Check',
    startupImage: [
      {
        url: '/splash.png',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon-192.png',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
