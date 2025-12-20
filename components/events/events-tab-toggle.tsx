"use client";

import { useUser } from "@clerk/nextjs";
import { Compass } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function EventsTabToggle() {
	const searchParams = useSearchParams();
	const { isSignedIn, user } = useUser();
	const currentTab = searchParams.get("mine") === "true" ? "mine" : "discover";

	return (
		<ToggleGroup type="single" value={currentTab} className="h-7">
			<ToggleGroupItem
				value="discover"
				aria-label="Explorar"
				className="h-7 px-2.5 gap-1.5"
				asChild
			>
				<Link href="/events">
					<Compass className="h-3.5 w-3.5" />
					<span className="text-xs">Explorar</span>
				</Link>
			</ToggleGroupItem>
			{isSignedIn && (
				<ToggleGroupItem
					value="mine"
					aria-label="Tus eventos"
					className="h-7 px-2.5 gap-1.5"
					asChild
				>
					<Link href="/events?mine=true">
						{user?.imageUrl ? (
							<Image
								src={user.imageUrl}
								alt=""
								width={14}
								height={14}
								className="rounded-full"
							/>
						) : (
							<div className="h-3.5 w-3.5 rounded-full bg-muted" />
						)}
						<span className="text-xs">Tus eventos</span>
					</Link>
				</ToggleGroupItem>
			)}
		</ToggleGroup>
	);
}
