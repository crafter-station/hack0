import {
	ExternalLink,
	Handshake,
	Search,
	Sparkles,
	Target,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	getOpportunityDirectoryEntries,
	getOpportunityDirectorySummary,
	type OpportunityDirectoryEntry,
} from "@/lib/opportunities-directory";
import { sanitizeImageUrl } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Programas y Grants | Peru Agentic Builder Index",
	description:
		"Directorio publico de aceleradoras, incubadoras, fondos y programas para builders en Peru.",
};

export const dynamic = "force-dynamic";

interface OpportunitiesPageProps {
	searchParams: Promise<{
		search?: string;
	}>;
}

export default async function OpportunitiesPage({
	searchParams,
}: OpportunitiesPageProps) {
	const params = await searchParams;
	const search = params.search?.trim() || undefined;
	const [summary, opportunities] = await Promise.all([
		getOpportunityDirectorySummary(),
		getOpportunityDirectoryEntries({ search }),
	]);

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<SiteHeader />

			<main className="flex-1">
				<section className="border-b">
					<div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-8">
						<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
							<div className="space-y-4">
								<div className="space-y-3">
									<Badge variant="outline" className="gap-2 rounded-none">
										<Handshake className="size-3.5" />
										Programas
									</Badge>
									<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
										Programas, grants e inversión
									</h1>
									<p className="max-w-2xl text-sm leading-6 text-muted-foreground">
										Directorio de incubadoras, aceleradoras, fondos, redes de
										ángeles e iniciativas de innovación abierta que ayudan a
										builders peruanos a conseguir soporte, capital o
										distribución.
									</p>
								</div>

								<form action="/opportunities" className="flex max-w-md gap-2">
									<div className="flex h-9 flex-1 items-center gap-2 border bg-background px-3">
										<Search className="size-4 text-muted-foreground" />
										<input
											type="search"
											name="search"
											defaultValue={search}
											placeholder="Buscar programa o fondo"
											className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
										/>
									</div>
									<Button type="submit" size="sm">
										Buscar
									</Button>
								</form>
							</div>

							<div className="grid grid-cols-2 border bg-card">
								<SummaryMetric label="programas" value={summary.total} />
								<SummaryMetric label="incubadoras" value={summary.incubators} />
								<SummaryMetric
									label="aceleradoras"
									value={summary.accelerators}
								/>
								<SummaryMetric label="fondos" value={summary.investors} />
							</div>
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-screen-xl px-4 py-6 lg:px-8">
					<div className="mb-4 flex items-center justify-between gap-4">
						<div>
							<h2 className="text-sm font-semibold">
								{search ? "Resultados" : "Oportunidades mapeadas"}
							</h2>
							<p className="mt-1 text-xs text-muted-foreground">
								{opportunities.length} organizaciones derivadas del mapa del
								ecosistema.
							</p>
						</div>
						{search && (
							<Button asChild variant="outline" size="sm">
								<Link href="/opportunities">Limpiar búsqueda</Link>
							</Button>
						)}
					</div>

					{opportunities.length > 0 ? (
						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
							{opportunities.map((opportunity) => (
								<OpportunityCard
									key={opportunity.id}
									opportunity={opportunity}
								/>
							))}
						</div>
					) : (
						<div className="border bg-card p-8 text-center">
							<p className="text-sm font-medium">No encontramos programas.</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Prueba con otro término o vuelve al directorio completo.
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
			<div className="text-2xl font-semibold tracking-tight">
				{new Intl.NumberFormat("es-PE").format(value)}
			</div>
			<div className="mt-1 text-xs text-muted-foreground">{label}</div>
		</div>
	);
}

function OpportunityCard({
	opportunity,
}: {
	opportunity: OpportunityDirectoryEntry;
}) {
	const logoUrl = sanitizeImageUrl(opportunity.logoUrl);
	const location = [opportunity.city, opportunity.department]
		.filter(Boolean)
		.join(", ");

	return (
		<article className="flex min-h-64 flex-col border bg-card p-4">
			<div className="flex items-start gap-3">
				<div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden border bg-muted text-sm font-semibold text-muted-foreground">
					{logoUrl ? (
						<img
							src={logoUrl}
							alt={opportunity.name}
							loading="lazy"
							decoding="async"
							className="h-full w-full object-cover"
						/>
					) : (
						getInitials(opportunity.name)
					)}
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="line-clamp-2 text-sm font-semibold">
						{opportunity.name}
					</h3>
					<div className="mt-2 flex flex-wrap items-center gap-2">
						<Badge variant="secondary" className="h-5 rounded-none text-[10px]">
							{opportunity.categoryLabel}
						</Badge>
						<Badge variant="outline" className="h-5 rounded-none text-[10px]">
							{opportunity.typeLabel}
						</Badge>
					</div>
				</div>
			</div>

			<p className="mt-4 line-clamp-4 text-xs leading-5 text-muted-foreground">
				{opportunity.description || "Programa del ecosistema peruano."}
			</p>

			<div className="mt-auto border-t pt-3">
				<div className="mb-3 grid grid-cols-2 gap-2 text-xs">
					<div className="border p-2">
						<div className="flex items-center gap-1.5 font-medium">
							<Target className="size-3.5" />
							{location || "Perú"}
						</div>
						<div className="mt-0.5 text-muted-foreground">ubicación</div>
					</div>
					<div className="border p-2">
						<div className="flex items-center gap-1.5 font-medium">
							<Sparkles className="size-3.5" />
							{opportunity.isVerified ? "verificado" : "por curar"}
						</div>
						<div className="mt-0.5 text-muted-foreground">estado</div>
					</div>
				</div>
				<div className="flex gap-2">
					<Button asChild variant="outline" size="sm" className="flex-1">
						<Link href={`/c/${opportunity.slug}`}>Perfil</Link>
					</Button>
					{opportunity.websiteUrl && (
						<Button asChild size="sm" className="flex-1 gap-2">
							<a
								href={opportunity.websiteUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								Web
								<ExternalLink className="size-3.5" />
							</a>
						</Button>
					)}
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
