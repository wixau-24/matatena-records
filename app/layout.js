import './globals.css';

export const metadata = {
  title: 'Matatena Records — Espacio de Composición, Creatividad y Estudio Musical',
  description:
    'Estudio musical enfocado en generar ideas y composición. Renta de estudio por grados ($2,000 a $4,000 MXN), Experiencia Compositora para todas las edades ($4,500 MXN) y espacio de uso múltiple.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

