import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OHLA - Documentos",
  description: "Repositorio de documentos OHLA",
  icons: {
    icon: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
