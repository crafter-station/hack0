import Image from "next/image";
import {
	getCountryFlag,
	getCountryName,
	getEventTypeLabel,
} from "@/lib/event-utils";
import { cn, sanitizeImageUrl } from "@/lib/utils";

type EventCoverEvent = {
	name: string;
	eventType: string | null;
	country: string | null;
	eventImageUrl: string | null;
	organization?: {
		slug?: string | null;
		name?: string | null;
		displayName?: string | null;
		logoUrl?: string | null;
	} | null;
};

type EventCoverProps = {
	event: EventCoverEvent;
	className?: string;
	imageClassName?: string;
	sizes: string;
	priority?: boolean;
	variant?: "poster" | "thumb";
};

function getShortTitle(title: string) {
	return title.split(/\s+/).filter(Boolean).slice(0, 5).join(" ");
}

export function EventCover({
	event,
	className,
	imageClassName,
	sizes,
	priority = false,
	variant = "poster",
}: EventCoverProps) {
	const imageUrl = event.eventImageUrl
		? sanitizeImageUrl(event.eventImageUrl)
		: undefined;
	const logoUrl = event.organization?.logoUrl
		? sanitizeImageUrl(event.organization.logoUrl)
		: undefined;
	const country = event.country ? getCountryName(event.country) : "LATAM";
	const flag = getCountryFlag(event.country);
	const label = getEventTypeLabel(event.eventType);

	return (
		<div className={cn("relative overflow-hidden bg-muted", className)}>
			{imageUrl ? (
				<Image
					src={imageUrl}
					alt={event.name}
					fill
					className={cn("object-cover", imageClassName)}
					sizes={sizes}
					priority={priority}
				/>
			) : (
				<div className="relative h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_32%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]">
					<div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,currentColor_1px,transparent_1px),linear-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px]" />
					{variant === "thumb" ? (
						<div className="relative flex h-full w-full items-center justify-center">
							{logoUrl ? (
								<Image
									src={logoUrl}
									alt={
										event.organization?.displayName ||
										event.organization?.name ||
										event.name
									}
									fill
									className="object-cover"
									sizes={sizes}
								/>
							) : (
								<span className="text-xs font-semibold text-foreground">
									{flag || event.name.charAt(0).toUpperCase()}
								</span>
							)}
						</div>
					) : (
						<div className="relative flex h-full w-full flex-col justify-between p-3">
							<div className="flex items-center justify-between gap-2 text-[10px] font-medium uppercase text-muted-foreground">
								<span>{label}</span>
								<span className="normal-case">
									{flag} {country}
								</span>
							</div>
							<div className="space-y-2">
								{logoUrl && (
									<div className="relative size-8 overflow-hidden border bg-background/80">
										<Image
											src={logoUrl}
											alt={
												event.organization?.displayName ||
												event.organization?.name ||
												event.name
											}
											fill
											className="object-cover"
											sizes="32px"
										/>
									</div>
								)}
								<div className="max-w-[14rem] text-sm font-semibold leading-tight text-foreground">
									{getShortTitle(event.name)}
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
