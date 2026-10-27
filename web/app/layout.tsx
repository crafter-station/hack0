import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-mono" });

export const metadata = {
  title: "hack0 · Mapeando el ecosistema tech de LATAM",
  description: "Damos visibilidad a comunidades y eventos tech de LATAM: hackathones, conferencias, workshops y meetups.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={mono.variable}>
      <body>{children}</body>
    </html>
  );
}
