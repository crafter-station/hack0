import { ClerkProvider } from "@clerk/nextjs";
import { JetBrains_Mono } from "next/font/google";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-mono" });

/** Applies the saved theme before paint so there is no flash. */
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export const metadata = {
  metadataBase: new URL("https://hack0.dev"),
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  openGraph: { siteName: "hack0", locale: "es_419", type: "website" },
  title: "hack0 · Mapeando el ecosistema tech de LATAM",
  description: "Damos visibilidad a comunidades y eventos tech de LATAM: hackathones, conferencias, workshops y meetups.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={mono.variable} suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static pre-paint theme script */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
