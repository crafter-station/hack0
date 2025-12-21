"use client";

import { Building2, Calendar, Check, ChevronsUpDown, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { assignOrganizationToEvent } from "@/lib/actions/pending-events";
import type { EventHost } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface PendingEvent {
	id: string;
	name: string;
	slug: string;
	startDate: Date | null;
	createdAt: Date | null;
	eventImageUrl: string | null;
	lumaHosts: EventHost[];
}

interface Organization {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
}

interface PendingOrgEventsProps {
	events: PendingEvent[];
	organizations: Organization[];
}

function formatDate(date: Date | null): string {
	if (!date) return "Sin fecha";
	return new Date(date).toLocaleDateString("es-PE", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function EventRow({
	event,
	organizations,
}: {
	event: PendingEvent;
	organizations: Organization[];
}) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [assigned, setAssigned] = useState(false);

	const handleAssign = (orgId: string) => {
		startTransition(async () => {
			const result = await assignOrganizationToEvent(event.id, orgId);
			if (result.success) {
				setAssigned(true);
			}
			setOpen(false);
		});
	};

	if (assigned) {
		return null;
	}

	return (
		<div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
			<div className="h-12 w-12 rounded-md bg-muted overflow-hidden flex-shrink-0">
				{event.eventImageUrl ? (
					<Image
						src={event.eventImageUrl}
						alt={event.name}
						width={48}
						height={48}
						className="object-cover w-full h-full"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<Calendar className="h-5 w-5 text-muted-foreground" />
					</div>
				)}
			</div>

			<div className="flex-1 min-w-0">
				<Link
					href={`/e/${event.slug}`}
					className="font-medium hover:underline truncate block"
				>
					{event.name}
				</Link>
				<div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
					<span>{formatDate(event.startDate)}</span>
					{event.lumaHosts.length > 0 && (
						<div className="flex items-center gap-1">
							<User className="h-3 w-3" />
							<span>
								{event.lumaHosts.map((h) => h.name).join(", ") || "Sin host"}
							</span>
						</div>
					)}
				</div>
			</div>

			<div className="flex items-center gap-2 flex-shrink-0">
				{event.lumaHosts.length > 0 && (
					<div className="flex -space-x-2">
						{event.lumaHosts.slice(0, 3).map((host) => (
							<Avatar key={host.id} className="h-6 w-6 border-2 border-background">
								<AvatarImage src={host.avatarUrl || undefined} />
								<AvatarFallback className="text-[10px]">
									{host.name?.charAt(0) || "?"}
								</AvatarFallback>
							</Avatar>
						))}
					</div>
				)}

				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="gap-2"
							disabled={isPending}
						>
							<Building2 className="h-3.5 w-3.5" />
							Asignar
							<ChevronsUpDown className="h-3 w-3 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[250px] p-0" align="end">
						<Command>
							<CommandInput placeholder="Buscar org..." />
							<CommandList>
								<CommandEmpty>No encontrado</CommandEmpty>
								<CommandGroup>
									{organizations.map((org) => (
										<CommandItem
											key={org.id}
											value={org.name}
											onSelect={() => handleAssign(org.id)}
											className="gap-2"
										>
											<Avatar className="h-5 w-5">
												<AvatarImage src={org.logoUrl || undefined} />
												<AvatarFallback className="text-[10px]">
													{org.name.charAt(0)}
												</AvatarFallback>
											</Avatar>
											<span className="truncate">{org.name}</span>
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
}

export function PendingOrgEvents({ events, organizations }: PendingOrgEventsProps) {
	if (events.length === 0) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				<Check className="h-8 w-8 mx-auto mb-3 text-emerald-500" />
				<p>No hay eventos pendientes de asignar</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{events.map((event) => (
				<EventRow key={event.id} event={event} organizations={organizations} />
			))}
		</div>
	);
}
