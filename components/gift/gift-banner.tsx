"use client";

import { Gift, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const BANNER_DISMISSED_KEY = "hack0_gift_banner_dismissed";

export function GiftBanner() {
	const pathname = usePathname();
	const [isDismissed, setIsDismissed] = useState(true);

	useEffect(() => {
		const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
		if (!dismissed) {
			setIsDismissed(false);
		}
	}, []);

	const handleDismiss = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		localStorage.setItem(BANNER_DISMISSED_KEY, "true");
		setIsDismissed(true);
	};

	if (isDismissed) return null;
	if (pathname?.startsWith("/gift")) return null;

	return (
		<div className="relative w-full bg-primary text-primary-foreground">
			<Link
				href="/gift"
				className="flex items-center justify-center gap-2 py-2.5 px-4 pr-10 text-sm font-medium hover:opacity-90 transition-opacity"
			>
				<Gift className="h-4 w-4 animate-pulse" />
				<span>¡Tenemos un regalo especial para ti!</span>
				<span className="underline underline-offset-4 font-semibold">
					Claim your gift →
				</span>
			</Link>
			<button
				type="button"
				onClick={handleDismiss}
				className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary-foreground/60 transition-colors hover:text-primary-foreground"
				aria-label="Cerrar banner"
			>
				<X className="h-4 w-4" />
			</button>
		</div>
	);
}
