"use client";

import {
	ArrowRight,
	Calendar,
	Code,
	LayoutDashboard,
	Loader2,
	MapPin,
	Plus,
	Sparkles,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import type { Event, Organization } from "@/lib/db/schema";
import { formatEventDateShort, getCountryFlag } from "@/lib/event-utils";

type EventWithOrganization = Event & { organization: Organization | null };

export function GlobalSearch() {
	const [open, setOpen] = React.useState(false);
	const [hackathons, setHackathons] = React.useState<EventWithOrganization[]>(
		[],
	);
	const [loading, setLoading] = React.useState(false);
	const [hasFetched, setHasFetched] = React.useState(false);
	const router = useRouter();

	// Fetch hackathons when dialog opens
	React.useEffect(() => {
		if (open && !hasFetched) {
			setLoading(true);
			fetch("/api/events")
				.then((res) => res.json())
				.then((data) => {
					setHackathons(data.events || []);
					setHasFetched(true);
				})
				.catch(console.error)
				.finally(() => setLoading(false));
		}
	}, [open, hasFetched]);

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		const handleCustomOpen = () => setOpen(true);

		document.addEventListener("keydown", down);
		document.addEventListener("open-search-command", handleCustomOpen);
		return () => {
			document.removeEventListener("keydown", down);
			document.removeEventListener("open-search-command", handleCustomOpen);
		};
	}, []);

	const runCommand = React.useCallback((command: () => unknown) => {
		setOpen(false);
		command();
	}, []);

	// Group hackathons by status
	const upcomingEvents = hackathons.filter((h) => {
		const now = new Date();
		const start = h.startDate ? new Date(h.startDate) : null;
		return start && start > now;
	});

	const ongoingEvents = hackathons.filter((h) => {
		const now = new Date();
		const start = h.startDate ? new Date(h.startDate) : null;
		const end = h.endDate ? new Date(h.endDate) : null;
		return start && end && start <= now && end >= now;
	});

	return (
		<CommandDialog
			open={open}
			onOpenChange={setOpen}
			title="Buscar eventos"
			description="Busca hackathons, conferencias y eventos tech en Perú"
		>
			<CommandInput placeholder="Buscar eventos..." />
			<CommandList>
				{loading ? (
					<div className="flex items-center justify-center py-6">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					</div>
				) : (
					<>
						<CommandEmpty>No se encontraron eventos.</CommandEmpty>

						{/* Quick actions */}
						<CommandGroup heading="Acciones">
							<CommandItem
								onSelect={() => runCommand(() => router.push("/c"))}
							>
								<LayoutDashboard className="mr-2 h-4 w-4" />
								Mi dashboard
							</CommandItem>
							<CommandItem
								onSelect={() =>
									runCommand(() => router.push("/for-organizers"))
								}
							>
								<Plus className="mr-2 h-4 w-4" />
								Soy organizador
							</CommandItem>
						</CommandGroup>

						{/* Filters */}
						<CommandGroup heading="Filtros">
							<CommandItem
								onSelect={() =>
									runCommand(() => router.push("/?eventType=hackathon"))
								}
							>
								<Code className="mr-2 h-4 w-4" />
								Solo hackathons
							</CommandItem>
							<CommandItem
								onSelect={() =>
									runCommand(() => router.push("/?juniorFriendly=true"))
								}
							>
								<Sparkles className="mr-2 h-4 w-4" />
								Para principiantes
							</CommandItem>
							<CommandItem
								onSelect={() =>
									runCommand(() => router.push("/?format=in-person"))
								}
							>
								<Users className="mr-2 h-4 w-4" />
								Presenciales
							</CommandItem>
						</CommandGroup>

						{/* Ongoing events */}
						{ongoingEvents.length > 0 && (
							<CommandGroup heading="En curso">
								{ongoingEvents.slice(0, 3).map((event) => {
									const eventUrl = event.organization?.slug
										? `/c/${event.organization.slug}/events/${event.slug}`
										: `/${event.slug}`;
									return (
										<CommandItem
											key={event.id}
											value={event.name}
											onSelect={() => runCommand(() => router.push(eventUrl))}
										>
											<div className="flex items-center gap-3 w-full">
												{event.eventImageUrl ? (
													<img
														src={event.eventImageUrl}
														alt=""
														className="h-6 w-6 rounded object-cover"
													/>
												) : (
													<span className="text-base">
														{getCountryFlag(event.country)}
													</span>
												)}
												<div className="flex-1 min-w-0">
													<p className="truncate font-medium">{event.name}</p>
													<p className="text-xs text-muted-foreground truncate">
														{event.organization?.displayName || event.organization?.name}
													</p>
												</div>
												<ArrowRight className="h-3 w-3 text-muted-foreground" />
											</div>
										</CommandItem>
									);
								})}
							</CommandGroup>
						)}

						{/* Upcoming events */}
						{upcomingEvents.length > 0 && (
							<CommandGroup heading="Próximos eventos">
								{upcomingEvents.slice(0, 5).map((event) => {
									const eventUrl = event.organization?.slug
										? `/c/${event.organization.slug}/events/${event.slug}`
										: `/${event.slug}`;
									return (
										<CommandItem
											key={event.id}
											value={event.name}
											onSelect={() => runCommand(() => router.push(eventUrl))}
										>
											<div className="flex items-center gap-3 w-full">
												{event.eventImageUrl ? (
													<img
														src={event.eventImageUrl}
														alt=""
														className="h-6 w-6 rounded object-cover"
													/>
												) : (
													<span className="text-base">
														{getCountryFlag(event.country)}
													</span>
												)}
												<div className="flex-1 min-w-0">
													<p className="truncate font-medium">{event.name}</p>
													<div className="flex items-center gap-2 text-xs text-muted-foreground">
														{event.startDate && (
															<span className="flex items-center gap-1">
																<Calendar className="h-3 w-3" />
																{formatEventDateShort(
																	new Date(event.startDate),
																)}
															</span>
														)}
														{event.country && (
															<span className="flex items-center gap-1">
																<MapPin className="h-3 w-3" />
																{getCountryFlag(event.country)}
															</span>
														)}
													</div>
												</div>
												<ArrowRight className="h-3 w-3 text-muted-foreground" />
											</div>
										</CommandItem>
									);
								})}
							</CommandGroup>
						)}
					</>
				)}
			</CommandList>
		</CommandDialog>
	);
}
