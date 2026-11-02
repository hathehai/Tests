import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Public_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

const publicSans = Public_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'AdPulse Paid Social Auditor',
  description:
    'Senior Performance Marketing Data Analyst workbench for Meta Ads and TikTok Ads schema normalization, weighted-average funnel diagnostics, creative image analysis, and multi-turn AI strategy.',
  openGraph: {
    title: 'AdPulse Paid Social Auditor',
    description:
      'Senior Performance Marketing Data Analyst workbench for Meta Ads and TikTok Ads schema normalization, weighted-average funnel diagnostics, creative image analysis, and multi-turn AI strategy.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdPulse Paid Social Auditor',
    description:
      'Senior Performance Marketing Data Analyst workbench for Meta Ads and TikTok Ads schema normalization, weighted-average funnel diagnostics, creative image analysis, and multi-turn AI strategy.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${publicSans.variable} ${jetbrainsMono.variable} dark`}
    >
      <body
        suppressHydrationWarning
        className="bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200"
      >
        {children}
      </body>
    </html>
  );
}
