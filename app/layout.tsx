import type { Metadata } from "next";
import type React from "react";
import "../styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "hack0.dev - Hackathons y eventos tech en Perú",
	description:
		"Encuentra hackathons, conferencias y eventos tech en Perú. Cero relleno, puro shipping.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider
			appearance={{
				theme: shadcn,
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
						<NuqsAdapter>{children}</NuqsAdapter>
					</ThemeProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
