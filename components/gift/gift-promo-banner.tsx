"use client";

import { Gift, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const BANNER_DISMISSED_KEY = "hack0_gift_banner_dismissed";
const BANNER_EXPIRY_DATE = new Date("2025-01-06T00:00:00Z");

export function GiftPromoBanner() {
	const pathname = usePathname();
	const [isDismissed, setIsDismissed] = useState(false);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
		const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
		if (dismissed) {
			setIsDismissed(true);
		}
	}, []);

	const handleDismiss = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		localStorage.setItem(BANNER_DISMISSED_KEY, "true");
		setIsDismissed(true);
	};

	if (!isClient) return null;
	if (new Date() > BANNER_EXPIRY_DATE) return null;
	if (isDismissed) return null;
	if (pathname?.startsWith("/gift")) return null;

	return (
		<Link
			href="/gift"
			className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 px-4 py-2 text-sm text-white transition-all hover:from-emerald-500 hover:via-green-500 hover:to-emerald-500"
		>
			<Gift className="h-4 w-4 animate-pulse" />
			<span className="font-medium">Reclama tu regalo de Navidad</span>
			<span className="hidden sm:inline text-white/80">
				— Una tarjeta personalizada con IA solo para ti
			</span>
			<button
				type="button"
				onClick={handleDismiss}
				className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/60 transition-colors hover:text-white"
				aria-label="Cerrar banner"
			>
				<X className="h-4 w-4" />
			</button>
		</Link>
	);
}
