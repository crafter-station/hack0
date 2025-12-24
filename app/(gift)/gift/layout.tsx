import type { Metadata } from "next";
import { DarkColorScheme } from "@/components/gift/dark-color-scheme";
import { Snowfall } from "@/components/gift/snowfall";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
	title: {
		default: "Regalo de Navidad 2025",
		template: "%s | Regalo de Navidad 2025",
	},
	description:
		"Recibe tu tarjeta de Navidad personalizada con IA. Un pequeño regalo de hack0.dev para ti.",
	keywords: [
		"tarjeta navidad",
		"navidad 2025",
		"regalo navidad",
		"tarjeta personalizada",
		"ia navidad",
		"hack0 navidad",
	],
	openGraph: {
		title: "Regalo de Navidad 2025 | hack0.dev",
		description:
			"Recibe tu tarjeta de Navidad personalizada con IA. Un pequeño regalo de hack0.dev para ti.",
		images: ["/og-gift.png"],
		type: "website",
		locale: "es_PE",
	},
	twitter: {
		card: "summary_large_image",
		title: "Regalo de Navidad 2025 | hack0.dev",
		description:
			"Recibe tu tarjeta de Navidad personalizada con IA. Un pequeño regalo de hack0.dev para ti.",
		images: ["/og-gift.png"],
	},
};

export default function GiftLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="dark min-h-screen flex flex-col relative overflow-hidden bg-background text-foreground">
			<DarkColorScheme />
			<Snowfall />
			<SiteHeader hideThemeToggle />
			<main className="flex-1 relative z-10">{children}</main>
			<SiteFooter />
		</div>
	);
}
