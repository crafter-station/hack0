import { CalendarDays, ExternalLink, Search, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	type BuilderDirectoryEntry,
	getBuilderDirectoryEntries,
	getBuilderDirectorySummary,
} from "@/lib/builders-directory";
import { formatEventDate } from "@/lib/event-utils";
import { sanitizeImageUrl } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Builders y Hosts | LATAM Builder Index",
	description:
		"Directorio publico de builders y hosts activos en eventos de IA, hackathons y comunidades tech en LATAM.",
};

export const dynamic = "force-dynamic";

interface BuildersPageProps {
	searchParams: Promise<{
		search?: string;
	}>;
}

export default async function BuildersPage({
	searchParams,
}: BuildersPageProps) {
	const params = await searchParams;
	const search = params.search?.trim() || undefined;
	const [summary, builders] = await Promise.all([
		getBuilderDirectorySummary(),
		getBuilderDirectoryEntries({ search }),
	]);

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<main className="flex-1">
				<section className="border-b">
					<div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8">
						<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
							<div className="space-y-4">
								<div className="space-y-3">
									<h1 className="text-3xl font-semibold sm:text-4xl">
										Builders y hosts
									</h1>
									<p className="max-w-2xl text-sm leading-6 text-muted-foreground">
										Personas que aparecen como hosts en eventos publicos del
										LATAM Builder Index. Es una senal practica de quien
										organiza, ensena, convoca o mueve comunidades.
									</p>
								</div>

								<form action="/builders" className="flex max-w-md gap-2">
									<div className="flex h-9 flex-1 items-center gap-2 border bg-background px-3">
										<Search className="size-4 text-muted-foreground" />
										<input
											type="search"
											name="search"
											defaultValue={search}
											placeholder="Buscar por nombre"
											className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
										/>
									</div>
									<Button type="submit" size="sm">
										Buscar
									</Button>
								</form>
							</div>

							<div className="grid grid-cols-2 border bg-card">
								<SummaryMetric label="builders" value={summary.builders} />
								<SummaryMetric label="eventos" value={summary.events} />
								<SummaryMetric
									label="apariciones"
									value={summary.hostAppearances}
								/>
								<SummaryMetric
									label="upcoming"
									value={summary.upcomingEvents}
								/>
							</div>
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-screen-xl px-4 lg:px-8 py-6">
					<div className="mb-4 flex items-center justify-between gap-4">
						<div>
							<h2 className="text-sm font-semibold">
								{search ? "Resultados" : "Top builders por actividad"}
							</h2>
							<p className="mt-1 text-xs text-muted-foreground">
								{builders.length} perfiles derivados de hosts de eventos.
							</p>
						</div>
						{search && (
							<Button asChild variant="outline" size="sm">
								<Link href="/builders">Limpiar búsqueda</Link>
							</Button>
						)}
					</div>

					{builders.length > 0 ? (
						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
							{builders.map((builder) => (
								<BuilderCard key={builder.hostKey} builder={builder} />
							))}
						</div>
					) : (
						<div className="border bg-card p-8 text-center">
							<p className="text-sm font-medium">No encontramos builders.</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Prueba con otro nombre o vuelve al directorio completo.
							</p>
						</div>
					)}
				</section>
			</main>

			<SiteFooter />
		</div>
	);
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
	return (
		<div className="border-b border-r p-4 last:border-r-0 even:border-r-0">
			<div className="text-2xl font-semibold">
				{new Intl.NumberFormat("es-PE").format(value)}
			</div>
			<div className="mt-1 text-xs text-muted-foreground">{label}</div>
		</div>
	);
}

function BuilderCard({ builder }: { builder: BuilderDirectoryEntry }) {
	const avatarUrl = sanitizeImageUrl(builder.avatarUrl);
	const latestEventHref = builder.latestEventCode
		? `/e/${builder.latestEventCode}`
		: null;

	return (
		<article className="border bg-card p-4">
			<div className="flex items-start gap-3">
				<div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden border bg-muted text-sm font-semibold text-muted-foreground">
					{avatarUrl ? (
						<img
							src={avatarUrl}
							alt={builder.name}
							loading="lazy"
							decoding="async"
							className="h-full w-full object-cover"
						/>
					) : (
						getInitials(builder.name)
					)}
				</div>

				<div className="min-w-0 flex-1">
					<h3 className="truncate text-sm font-semibold">{builder.name}</h3>
					<div className="mt-1 flex flex-wrap items-center gap-2">
						<Badge variant="secondary" className="h-5 rounded-none text-[10px]">
							{builder.eventCount} eventos
						</Badge>
						{builder.upcomingEventCount > 0 && (
							<Badge variant="outline" className="h-5 rounded-none text-[10px]">
								{builder.upcomingEventCount} upcoming
							</Badge>
						)}
					</div>
				</div>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-2 text-xs">
				<div className="border p-2">
					<div className="flex items-center gap-1.5 font-medium">
						<CalendarDays className="size-3.5" />
						{builder.hostAppearances}
					</div>
					<div className="mt-0.5 text-muted-foreground">apariciones</div>
				</div>
				<div className="border p-2">
					<div className="flex items-center gap-1.5 font-medium">
						<Users className="size-3.5" />
						{builder.organizationCount}
					</div>
					<div className="mt-0.5 text-muted-foreground">orgs</div>
				</div>
			</div>

			<div className="mt-4 border-t pt-3 text-xs">
				<div className="text-muted-foreground">Última actividad</div>
				{latestEventHref ? (
					<Link
						href={latestEventHref}
						className="mt-1 flex items-center gap-1.5 font-medium hover:underline"
					>
						<span className="line-clamp-1">
							{builder.latestEventName || "Evento"}
						</span>
						<ExternalLink className="size-3 shrink-0" />
					</Link>
				) : (
					<div className="mt-1 font-medium">
						{builder.latestEventName || "Evento"}
					</div>
				)}
				<div className="mt-1 text-muted-foreground">
					{builder.latestOrganizationName || "Organización"} ·{" "}
					{formatEventDate(builder.latestEventAt) || "Sin fecha"}
				</div>
			</div>
		</article>
	);
}

function getInitials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
}
