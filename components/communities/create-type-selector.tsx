"use client";

import { ArrowRight, Building2, CalendarPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CreateTypeSelectorProps {
	communitySlug: string;
	communityName: string;
}

export function CreateTypeSelector({
	communitySlug,
}: CreateTypeSelectorProps) {
	const router = useRouter();
	const [navigatingTo, setNavigatingTo] = useState<"event" | "community" | null>(null);

	const handleCreateEvent = () => {
		setNavigatingTo("event");
		router.push(`/c/${communitySlug}/events/new`);
	};

	const handleCreateCommunity = () => {
		setNavigatingTo("community");
		router.push("/c/new");
	};

	const isNavigating = navigatingTo !== null;

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			<button
				type="button"
				onClick={handleCreateEvent}
				disabled={isNavigating}
				className="group relative p-6 rounded-lg border-2 border-border hover:border-foreground bg-card text-left transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<div className="flex items-start gap-4">
					<div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-foreground/5 transition-colors">
						{navigatingTo === "event" ? (
							<Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
						) : (
							<CalendarPlus className="h-6 w-6 text-muted-foreground" />
						)}
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold mb-1">Evento</h3>
						<p className="text-sm text-muted-foreground mb-3">
							Hackathons, talleres, meetups, conferencias y más
						</p>
						<div className="flex items-center gap-1 text-sm font-medium text-foreground group-hover:gap-2 transition-all">
							{navigatingTo === "event" ? "Cargando..." : "Crear evento"}
							{navigatingTo !== "event" && <ArrowRight className="h-4 w-4" />}
						</div>
					</div>
				</div>
			</button>

			<button
				type="button"
				onClick={handleCreateCommunity}
				disabled={isNavigating}
				className="group relative p-6 rounded-lg border-2 border-border hover:border-foreground bg-card text-left transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<div className="flex items-start gap-4">
					<div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-foreground/5 transition-colors">
						{navigatingTo === "community" ? (
							<Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
						) : (
							<Building2 className="h-6 w-6 text-muted-foreground" />
						)}
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold mb-1">Comunidad</h3>
						<p className="text-sm text-muted-foreground mb-3">
							Crea una organización para publicar eventos
						</p>
						<div className="flex items-center gap-1 text-sm font-medium text-foreground group-hover:gap-2 transition-all">
							{navigatingTo === "community" ? "Cargando..." : "Crear comunidad"}
							{navigatingTo !== "community" && <ArrowRight className="h-4 w-4" />}
						</div>
					</div>
				</div>
			</button>
		</div>
	);
}
