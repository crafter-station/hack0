"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareEventButtonProps {
	eventSlug: string;
	organizationSlug?: string;
	eventName: string;
	eventDescription?: string | null;
}

export function ShareEventButton({
	eventSlug,
	organizationSlug,
	eventName,
	eventDescription,
}: ShareEventButtonProps) {
	const [copied, setCopied] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const eventUrl = organizationSlug
		? `${typeof window !== "undefined" ? window.location.origin : ""}/c/${organizationSlug}/events/${eventSlug}`
		: `${typeof window !== "undefined" ? window.location.origin : ""}/${eventSlug}`;

	const shareToSocial = (platform: string, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const text = `${eventName}${eventDescription ? ` - ${eventDescription.slice(0, 100)}` : ""}`;
		const urls = {
			twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(eventUrl)}`,
			facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
			linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`,
		};

		window.open(
			urls[platform as keyof typeof urls],
			"_blank",
			"width=600,height=400",
		);
		setIsOpen(false);
	};

	const copyLink = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		try {
			await navigator.clipboard.writeText(eventUrl);
			setCopied(true);
			toast.success("Link copiado");
			setTimeout(() => {
				setCopied(false);
				setIsOpen(false);
			}, 1500);
		} catch (_error) {
			toast.error("Error al copiar");
		}
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger
				asChild
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
				}}
			>
				<button className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
					<Share2 className="h-4 w-4 text-muted-foreground" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-44"
				onClick={(e) => e.stopPropagation()}
			>
				<DropdownMenuItem onClick={copyLink} className="gap-2">
					{copied ? (
						<>
							<Check className="h-4 w-4 text-emerald-600" />
							<span>Copiado!</span>
						</>
					) : (
						<>
							<Copy className="h-4 w-4" />
							<span>Copiar link</span>
						</>
					)}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={(e) => shareToSocial("twitter", e)}
					className="gap-2"
				>
					<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
						<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
					</svg>
					<span>Twitter / X</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={(e) => shareToSocial("facebook", e)}
					className="gap-2"
				>
					<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
						<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
					</svg>
					<span>Facebook</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={(e) => shareToSocial("linkedin", e)}
					className="gap-2"
				>
					<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
						<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
					</svg>
					<span>LinkedIn</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
