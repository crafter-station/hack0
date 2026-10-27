import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-mono" });

export const metadata = {
  title: "hack0 · eventos tech de LATAM y workshops",
  description: "El calendario de eventos tech de LATAM, más workshops prácticos para construir con IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={mono.variable}>
      <body>{children}</body>
    </html>
  );
}
