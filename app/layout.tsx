import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Harid AI Recruiting',
  description: 'Piattaforma di selezione automatizzata con intervista AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
