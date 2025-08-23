import type React from "react"
import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "hack0.dev - Hackathons para Builders LATAM",
  description: "El espacio para los hackathons más ambiciosos de LATAM. Cero relleno, puro shipping.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <style>{`
html {
  font-family: ${GeistMono.style.fontFamily};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className={`${GeistMono.variable} antialiased`}>{children}</body>
    </html>
  )
}
