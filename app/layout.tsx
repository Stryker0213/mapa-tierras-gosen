import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tierras Gosén | Explora la naturaleza',
  description: 'Explora alojamientos, senderos, miradores y experiencias de Tierras Gosén.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
