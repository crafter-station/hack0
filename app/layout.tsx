import type { Metadata, Viewport } from "next";
import type React from "react";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/(app)/api/uploadthing/core";
import { GlobalSearch } from "@/components/global-search";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeSelector } from "@/components/theme-selector";
import { PostHogProvider } from "../app/providers/posthog";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const siteConfig = {
	name: "hack0.dev",
	title: "Hackathons y Eventos Tech en Perú",
	description:
		"Descubre hackathons, conferencias, talleres y eventos de tecnología en Perú. La plataforma más completa para encontrar competencias de programación, workshops de IA, meetups tech y más.",
	url: "https://hack0.dev",
	ogImage: "https://hack0.dev/og.png",
	keywords: [
		"hackathons peru",
		"hackathon peru",
		"hackathones peru",
		"eventos tech peru",
		"eventos tecnologia peru",
		"conferencias tech peru",
		"talleres programacion peru",
		"competencias programacion peru",
		"meetups tech lima",
		"eventos IA peru",
		"eventos inteligencia artificial peru",
		"workshops tecnologia peru",
		"comunidad tech peru",
		"desarrolladores peru",
		"programadores peru",
		"startups peru",
		"innovacion peru",
		"bootcamps peru",
		"hackatones lima",
		"eventos developer peru",
	],
};

export const metadata: Metadata = {
	metadataBase: new URL(siteConfig.url),
	title: {
		default: `${siteConfig.name} - ${siteConfig.title}`,
		template: `%s | ${siteConfig.name}`,
	},
	description: siteConfig.description,
	keywords: siteConfig.keywords,
	authors: [
		{ name: "Crafter Station", url: "https://github.com/crafter-station" },
	],
	creator: "Crafter Station",
	publisher: "Crafter Station",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	openGraph: {
		type: "website",
		locale: "es_PE",
		url: siteConfig.url,
		title: `${siteConfig.name} - ${siteConfig.title}`,
		description: siteConfig.description,
		siteName: siteConfig.name,
		images: [
			{
				url: siteConfig.ogImage,
				width: 1200,
				height: 630,
				alt: siteConfig.title,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `${siteConfig.name} - ${siteConfig.title}`,
		description: siteConfig.description,
		images: [siteConfig.ogImage],
		creator: "@crafterstation",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	alternates: {
		canonical: siteConfig.url,
		types: {
			"application/rss+xml": `${siteConfig.url}/feed.xml`,
		},
	},
	category: "technology",
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#000000" },
	],
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: siteConfig.name,
		description: siteConfig.description,
		url: siteConfig.url,
		potentialAction: {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: `${siteConfig.url}/?search={search_term_string}`,
			},
			"query-input": "required name=search_term_string",
		},
		publisher: {
			"@type": "Organization",
			name: "Crafter Station",
			url: "https://github.com/crafter-station",
		},
	};

	const organizationJsonLd = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: siteConfig.name,
		url: siteConfig.url,
		logo: `${siteConfig.url}/logo.png`,
		sameAs: ["https://github.com/crafter-station/hack0"],
		contactPoint: {
			"@type": "ContactPoint",
			email: "hey@hack0.dev",
			contactType: "customer service",
		},
	};

	return (
		<ClerkProvider
			appearance={{
				theme: shadcn,
			}}
		>
			<html lang="es" suppressHydrationWarning>
				<head>
					<link rel="preconnect" href="https://utfs.io" />
					<link rel="dns-prefetch" href="https://utfs.io" />
					<link rel="preconnect" href="https://images.clerk.dev" />
					<link rel="dns-prefetch" href="https://images.clerk.dev" />
					<script
						type="application/ld+json"
						dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
					/>
					<script
						type="application/ld+json"
						dangerouslySetInnerHTML={{
							__html: JSON.stringify(organizationJsonLd),
						}}
					/>
				</head>
				<body
					className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
				>
					<NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
					<ThemeProvider
						attribute="class"
						defaultTheme="dark"
						enableSystem={false}
					>
						<QueryProvider>
							<PostHogProvider>
								<NuqsAdapter>{children}</NuqsAdapter>
							</PostHogProvider>
							<GlobalSearch />
							<ThemeSelector />
						</QueryProvider>
					</ThemeProvider>
					<Analytics />
				</body>
			</html>
		</ClerkProvider>
	);
}
