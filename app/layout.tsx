import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Harid AI Recruiting',
  description: 'Piattaforma di selezione automatizzata con intervista AI simulata, report e gestione posizioni.',
  openGraph: {
    title: 'Harid AI Recruiting',
    description: 'Candidate + HR: colloquio AI simulato, report e gestione posizioni.',
    type: 'website',
    locale: 'it_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harid AI Recruiting',
    description: 'Piattaforma di selezione automatizzata con intervista AI.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
