import { Gift } from "lucide-react";
import Link from "next/link";

export function GiftBanner() {
	return (
		<div className="w-full bg-primary text-primary-foreground">
			<div className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium">
				<Gift className="h-4 w-4 animate-pulse" />
				<span>¡Tenemos un regalo especial para ti!</span>
				<Link
					href="/gift"
					className="ml-2 underline underline-offset-4 hover:opacity-80 transition-opacity font-semibold"
				>
					Claim your gift →
				</Link>
			</div>
		</div>
	);
}
