import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "flag-icons/css/flag-icons.min.css";
import { THEME_COLORS } from "@/lib/theme";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-mono" });

/** Applies the saved theme before paint so there is no flash. */
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.content=t==="dark"?"${THEME_COLORS.dark}":"${THEME_COLORS.light}"})}}catch(e){}`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
};

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
        <ClerkProvider
          appearance={{
            theme: shadcn,
            variables: { fontFamily: "var(--font-mono), ui-monospace, monospace", borderRadius: "0" },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
