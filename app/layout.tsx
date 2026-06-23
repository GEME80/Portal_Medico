import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Dr. Carlos Torres Martínez | Infectólogo Pediatra & EcoVaccine",
    template: "%s | Dr. Carlos Torres Martínez",
  },
  description:
    "Portal oficial del Dr. Carlos Torres Martínez, Infectólogo Pediatra con más de 30 años de experiencia. Información científica sobre vacunación, prevención de enfermedades infecciosas y EcoVaccine POS.",
  keywords: [
    "infectólogo pediatra",
    "vacunación",
    "Dr. Carlos Torres",
    "EcoVaccine",
    "pediatría",
    "prevención enfermedades",
    "vacunas Colombia",
  ],
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Dr. Carlos Torres Martínez",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
