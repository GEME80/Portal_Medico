import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HubMed Platform | Gestión Vacunal y Portales Médicos SaaS",
    template: "%s | HubMed",
  },
  description:
    "HubMed es la plataforma SaaS multi-tenant definitiva para consultorios y clínicas médicas. Administra inventario de vacunas, lotes, dosis aplicadas y personaliza tu marca personal con portales médicos dinámicos y dominios propios.",
  keywords: [
    "SaaS médico",
    "gestión de vacunas",
    "inventario vacunas",
    "portal médico",
    "marca personal doctores",
    "clínica",
    "pediatría",
    "prevención de enfermedades",
  ],
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "HubMed Platform",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "1024x1024" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/icon.png", sizes: "1024x1024", type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="1024x1024" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
