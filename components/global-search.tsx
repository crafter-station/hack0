"use client";

import {
	ArrowRight,
	Building2,
	Calendar,
	Code,
	Home,
	LayoutDashboard,
	Loader2,
	LogIn,
	MapPin,
	Plus,
	Search,
	Settings,
	Shield,
	Sparkles,
	UserPlus,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useUser } from "@clerk/nextjs";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import type { Event, Organization } from "@/lib/db/schema";
import { formatEventDateShort, getCountryFlag } from "@/lib/event-utils";

type EventWithOrganization = Event & { organization: Organization | null };

interface OrganizationWithRole {
	organization: Organization;
	role: "owner" | "admin" | "member" | "follower";
}

export function GlobalSearch() {
	const [open, setOpen] = React.useState(false);
	const [hackathons, setHackathons] = React.useState<EventWithOrganization[]>(
		[],
	);
	const [communities, setCommunities] = React.useState<OrganizationWithRole[]>(
		[],
	);
	const [allCommunities, setAllCommunities] = React.useState<Organization[]>(
		[],
	);
	const [loading, setLoading] = React.useState(false);
	const [hasFetched, setHasFetched] = React.useState(false);
	const router = useRouter();
	const { isSignedIn, user } = useUser();

	// Fetch data when dialog opens
	React.useEffect(() => {
		if (open && !hasFetched) {
			setLoading(true);
			Promise.all([
				fetch("/api/events").then((res) => res.json()),
				fetch("/api/organizations/my-communities")
					.then((res) => res.json())
					.catch(() => ({ organizations: [] })),
				fetch("/api/organizations")
					.then((res) => res.json())
					.catch(() => ({ organizations: [] })),
			])
				.then(([eventsData, myCommunitiesData, allCommunitiesData]) => {
					setHackathons(eventsData.events || []);
					setCommunities(myCommunitiesData.organizations || []);
					setAllCommunities(allCommunitiesData.organizations || []);
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
			title="Buscar"
			description="Busca eventos, comunidades y acciones rápidas"
		>
			<CommandInput placeholder="Buscar eventos, comunidades..." />
			<CommandList>
				{loading ? (
					<div className="flex items-center justify-center py-6">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					</div>
				) : (
					<>
						<CommandEmpty>No se encontraron resultados.</CommandEmpty>

						{/* Quick actions - context aware */}
						<CommandGroup heading="Acciones rápidas">
							{!isSignedIn ? (
								<>
									<CommandItem
										onSelect={() => runCommand(() => router.push("/sign-in"))}
									>
										<LogIn className="mr-2 h-4 w-4" />
										Iniciar sesión
									</CommandItem>
									<CommandItem
										onSelect={() => runCommand(() => router.push("/sign-up"))}
									>
										<UserPlus className="mr-2 h-4 w-4" />
										Crear cuenta
									</CommandItem>
								</>
							) : (
								<>
									<CommandItem
										onSelect={() => runCommand(() => router.push("/c/new"))}
									>
										<Plus className="mr-2 h-4 w-4" />
										Crear comunidad
									</CommandItem>
									<CommandItem
										onSelect={() => runCommand(() => router.push("/submit"))}
									>
										<Calendar className="mr-2 h-4 w-4" />
										Publicar evento
									</CommandItem>
								</>
							)}
							<CommandItem onSelect={() => runCommand(() => router.push("/"))}>
								<Home className="mr-2 h-4 w-4" />
								Ir al inicio
							</CommandItem>
						</CommandGroup>

						{/* My Communities */}
						{isSignedIn && communities.length > 0 && (
							<CommandGroup heading="Mis comunidades">
								{communities.slice(0, 5).map(({ organization, role }) => (
									<CommandItem
										key={organization.id}
										value={organization.displayName || organization.name}
										onSelect={() =>
											runCommand(() => router.push(`/c/${organization.slug}`))
										}
									>
										<div className="flex items-center gap-3 w-full">
											{organization.logoUrl ? (
												<img
													src={organization.logoUrl}
													alt=""
													className="h-6 w-6 rounded object-cover"
												/>
											) : (
												<Building2 className="h-6 w-6 text-muted-foreground" />
											)}
											<div className="flex-1 min-w-0">
												<p className="truncate font-medium">
													{organization.displayName || organization.name}
												</p>
												<p className="text-xs text-muted-foreground capitalize">
													{role}
												</p>
											</div>
											<ArrowRight className="h-3 w-3 text-muted-foreground" />
										</div>
									</CommandItem>
								))}
								{communities.length > 5 && (
									<CommandItem
										onSelect={() => runCommand(() => router.push("/c"))}
									>
										<LayoutDashboard className="mr-2 h-4 w-4" />
										Ver todas mis comunidades
									</CommandItem>
								)}
							</CommandGroup>
						)}

						{/* Browse */}
						<CommandGroup heading="Explorar">
							<CommandItem onSelect={() => runCommand(() => router.push("/c"))}>
								<Search className="mr-2 h-4 w-4" />
								Todas las comunidades
							</CommandItem>
							<CommandItem onSelect={() => runCommand(() => router.push("/"))}>
								<Calendar className="mr-2 h-4 w-4" />
								Todos los eventos
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
								<MapPin className="mr-2 h-4 w-4" />
								Presenciales
							</CommandItem>
							<CommandItem
								onSelect={() =>
									runCommand(() => router.push("/?format=virtual"))
								}
							>
								<Users className="mr-2 h-4 w-4" />
								Virtuales
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
