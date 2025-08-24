import type React from "react";
import type { Metadata } from "next";
import "../styles/globals.css";

import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "hack0.dev - Hackathons para Builders LATAM",
  description:
    "El espacio para los hackathons más ambiciosos de LATAM. Cero relleno, puro shipping.",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      waitlistUrl="/waitlist"
      appearance={{
        elements: {
          headerTitle: "!hidden !text-foreground !text-lg",
          headerSubtitle: "!hidden",
          formButtonPrimary:
            "!bg-primary !border-border !text-primary-foreground hover:!bg-primary/90",
          card: "!bg-card !py-0 !text-card-foreground !shadow-sm",
          footer: "!hidden",
          socialButtonsBlockButton:
            "!bg-muted !border !border-foreground/10 !text-muted-foreground hover:!bg-foreground/10",
          socialButtonsIconButton:
            "!border !border-input !bg-background hover:!bg-accent hover:!text-accent-foreground",
          formButtonReset: "!text-muted-foreground hover:!text-foreground",
          formFieldInput:
            "!text-foreground !border !border-input !bg-muted focus-visible:!bg-background !placeholder-muted-foreground focus-visible:!ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-transparent",
          formFieldLabel: "!text-foreground !text-sm",
          formFieldAction: "!text-muted-foreground !text-sm",
          dividerText: "!text-muted-foreground !text-sm",
          dividerLine: "!bg-border",
          socialButtonsBlockButtonText: "!text-muted-foreground",
          userPreviewMainIdentifier: "!text-foreground !font-medium",
          userPreviewSecondaryIdentifier: "!text-muted-foreground !text-sm",
          socialButtonsProviderIcon__github: "dark:invert",
          userButtonAvatarBox: "h-5 w-5",
          userButtonAvatarImage: "h-5 w-5",
          userButtonTrigger:
            "!h-10 !p-0 !w-full flex !justify-start !bg-muted !border !border-input hover:!bg-sidebar-accent  group-data-[collapsible=icon]:hover:!bg-transparent !px-2 group-data-[collapsible=icon]:!px-0 group-data-[collapsible=icon]:!bg-transparent group-data-[collapsible=icon]:!border-none transition-colors",

          userButtonBox:
            "!text-foreground !flex-row-reverse !gap-2 items-center",
          userButtonOuterIdentifier:
            "text-sm font-medium truncate group-data-[collapsible=icon]:!hidden",
          userButtonPopoverMain: "!bg-card !text-card-foreground",
          userButtonPopoverCard: "!bg-card !text-card-foreground",
          userButtonPopoverFooter: "!hidden",
          userButtonPopoverActionButton:
            "!bg-muted border-t !border-input !text-muted-foreground hover:!bg-foreground/10",
          userButtonPopoverActions: "!border-t !border-input",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
