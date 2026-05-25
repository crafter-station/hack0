import {
	Activity,
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	CircleDashed,
	Database,
	ExternalLink,
	ListChecks,
	Table2,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	type CoverageBreakdownRow,
	type CoverageFacet,
	type CoverageStatus,
	getIndexDataHealth,
	type QualitySignal,
} from "@/lib/index-data-health";

export const metadata: Metadata = {
	title: "Data Health | Peru Agentic Builder Index",
	description:
		"Cobertura, fuentes y gaps actuales del Peru Agentic Builder Index.",
};

export const dynamic = "force-dynamic";

const statusCopy: Record<CoverageStatus, { label: string; className: string }> =
	{
		live: {
			label: "live",
			className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
		},
		needs_backfill: {
			label: "backfill",
			className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
		},
		not_modeled: {
			label: "sin modelo",
			className: "border-muted bg-muted text-muted-foreground",
		},
	};

const severityCopy: Record<QualitySignal["severity"], string> = {
	good: "text-emerald-600",
	watch: "text-amber-600",
	fix: "text-red-600",
};

function formatNumber(value: number) {
	return new Intl.NumberFormat("es-PE").format(value);
}

function formatDate(value: Date | null) {
	if (!value) return "Sin registro";
	return new Intl.DateTimeFormat("es-PE", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(value);
}

export default async function DataHealthPage() {
	const health = await getIndexDataHealth();
	const backfillQueue = health.facets.filter(
		(facet) => facet.status !== "live",
	);
	const totalLiveFacets = health.facets.filter(
		(facet) => facet.status === "live",
	).length;

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<SiteHeader />

			<main className="flex-1">
				<section className="border-b">
					<div className="mx-auto max-w-screen-xl px-4 py-10 lg:px-8 lg:py-14">
						<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
							<div className="max-w-3xl space-y-5">
								<Badge variant="outline" className="gap-2 rounded-none">
									<Database className="size-3.5" />
									Data health
								</Badge>
								<div className="space-y-3">
									<h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
										Cobertura del Peru Agentic Builder Index
									</h1>
									<p className="max-w-2xl text-base leading-7 text-muted-foreground">
										Vista pública de lo que ya está mapeado, qué viene de datos
										reales y qué todavía necesita backfill antes del primer
										State of Agentic Builders in Peru.
									</p>
								</div>
								<div className="flex flex-col gap-2 sm:flex-row">
									<Button asChild size="sm" className="gap-2">
										<Link href="/events?country=PE">
											Ver eventos
											<ArrowRight className="size-4" />
										</Link>
									</Button>
									<Button asChild variant="outline" size="sm" className="gap-2">
										<a href="mailto:hey@hack0.dev?subject=Actualizar%20Peru%20Agentic%20Builder%20Index">
											Reportar dataset
											<ExternalLink className="size-4" />
										</a>
									</Button>
								</div>
							</div>

							<div className="grid grid-cols-2 border bg-card">
								<HeroMetric label="facetas live" value={totalLiveFacets} />
								<HeroMetric
									label="facetas totales"
									value={health.facets.length}
								/>
								<HeroMetric
									label="último evento"
									value={formatDate(health.updatedAt)}
									text
								/>
								<HeroMetric
									label="último scrape"
									value={formatDate(health.latestSourceScrapedAt)}
									text
								/>
							</div>
						</div>
					</div>
				</section>

				<section className="border-b bg-muted/20">
					<div className="mx-auto max-w-screen-xl px-4 py-6 lg:px-8">
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							{health.facets.map((facet) => (
								<CoverageCard key={facet.id} facet={facet} />
							))}
						</div>
					</div>
				</section>

				<section className="mx-auto grid max-w-screen-xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
					<div className="space-y-8">
						<SectionHeader
							icon={ListChecks}
							title="Backfill queue"
							description="Trabajo pendiente ordenado por gaps reales del modelo actual."
						/>
						<div className="grid gap-3">
							{backfillQueue.map((facet) => (
								<BackfillRow key={facet.id} facet={facet} />
							))}
						</div>

						<SectionHeader
							icon={Activity}
							title="Calidad de datos"
							description="Campos que afectan SEO, filtros, confianza y directorios públicos."
						/>
						<div className="grid gap-3 md:grid-cols-2">
							{health.qualitySignals.map((signal) => (
								<QualityCard key={signal.label} signal={signal} />
							))}
						</div>
					</div>

					<aside className="space-y-6">
						<BreakdownSection
							title="Fuentes de eventos"
							rows={health.sourceBreakdown}
						/>
						<BreakdownSection
							title="Tipos de evento"
							rows={health.eventTypeBreakdown}
						/>
						<BreakdownSection
							title="Tipos de organización"
							rows={health.organizationTypeBreakdown}
						/>
						<BreakdownSection title="Ciudades" rows={health.cityBreakdown} />
						<OperationsPanel operations={health.operations} />
					</aside>
				</section>
			</main>

			<SiteFooter />
		</div>
	);
}

function HeroMetric({
	label,
	value,
	text = false,
}: {
	label: string;
	value: number | string;
	text?: boolean;
}) {
	return (
		<div className="border-b border-r p-4 last:border-r-0 even:border-r-0">
			<div
				className={
					text
						? "text-sm font-semibold tracking-tight"
						: "text-2xl font-semibold tracking-tight"
				}
			>
				{typeof value === "number" ? formatNumber(value) : value}
			</div>
			<div className="mt-1 text-xs text-muted-foreground">{label}</div>
		</div>
	);
}

function CoverageCard({ facet }: { facet: CoverageFacet }) {
	const status = statusCopy[facet.status];
	const content = (
		<div className="group flex min-h-40 flex-col justify-between border bg-background p-4 transition-colors hover:bg-card">
			<div className="space-y-3">
				<div className="flex items-start justify-between gap-3">
					<div>
						<div className="text-2xl font-semibold tracking-tight">
							{formatNumber(facet.count)}
						</div>
						<h2 className="mt-1 text-sm font-medium">{facet.label}</h2>
					</div>
					<Badge className={`rounded-none ${status.className}`}>
						{status.label}
					</Badge>
				</div>
				<div className="space-y-1 text-xs leading-5 text-muted-foreground">
					<p>{facet.evidence}</p>
					<p>Fuente: {facet.source}</p>
				</div>
			</div>
			<div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
				<span className="line-clamp-1">{facet.nextAction}</span>
				{facet.href && <ArrowRight className="size-3.5 shrink-0" />}
			</div>
		</div>
	);

	if (!facet.href) return content;
	return <Link href={facet.href}>{content}</Link>;
}

function SectionHeader({
	icon: Icon,
	title,
	description,
}: {
	icon: typeof ListChecks;
	title: string;
	description: string;
}) {
	return (
		<div className="flex items-start gap-3">
			<div className="flex size-9 shrink-0 items-center justify-center border bg-muted/40 text-muted-foreground">
				<Icon className="size-4" />
			</div>
			<div>
				<h2 className="text-xl font-semibold tracking-tight">{title}</h2>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			</div>
		</div>
	);
}

function BackfillRow({ facet }: { facet: CoverageFacet }) {
	const status = statusCopy[facet.status];

	return (
		<div className="grid gap-4 border bg-card p-4 md:grid-cols-[180px_minmax(0,1fr)]">
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					{facet.status === "not_modeled" ? (
						<CircleDashed className="size-4 text-muted-foreground" />
					) : (
						<AlertTriangle className="size-4 text-amber-600" />
					)}
					<h3 className="text-sm font-semibold">{facet.label}</h3>
				</div>
				<Badge className={`rounded-none ${status.className}`}>
					{status.label}
				</Badge>
			</div>
			<div className="space-y-2 text-sm">
				<p>{facet.nextAction}</p>
				<p className="text-xs text-muted-foreground">
					Evidencia actual: {facet.evidence}. Fuente: {facet.source}.
				</p>
			</div>
		</div>
	);
}

function QualityCard({ signal }: { signal: QualitySignal }) {
	const ratio =
		signal.total > 0 ? Math.round((signal.value / signal.total) * 100) : 0;

	return (
		<div className="border bg-card p-4">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h3 className="text-sm font-semibold">{signal.label}</h3>
					<p className="mt-1 text-xs leading-5 text-muted-foreground">
						{signal.nextAction}
					</p>
				</div>
				<CheckCircle2 className={`size-4 ${severityCopy[signal.severity]}`} />
			</div>
			<div className="mt-4 flex items-end justify-between gap-3">
				<div className="text-2xl font-semibold tracking-tight">
					{formatNumber(signal.value)}
				</div>
				<div className="text-xs text-muted-foreground">
					{ratio}% de {formatNumber(signal.total)}
				</div>
			</div>
		</div>
	);
}

function BreakdownSection({
	title,
	rows,
}: {
	title: string;
	rows: CoverageBreakdownRow[];
}) {
	return (
		<section className="border bg-card">
			<div className="flex items-center gap-2 border-b px-4 py-3">
				<Table2 className="size-4 text-muted-foreground" />
				<h2 className="text-sm font-semibold">{title}</h2>
			</div>
			<div className="divide-y">
				{rows.length > 0 ? (
					rows.map((row) => <BreakdownRow key={row.label} row={row} />)
				) : (
					<div className="p-4 text-sm text-muted-foreground">Sin datos.</div>
				)}
			</div>
		</section>
	);
}

function BreakdownRow({ row }: { row: CoverageBreakdownRow }) {
	return (
		<div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
			<div className="min-w-0">
				<div className="truncate font-medium">{row.label}</div>
				<div className="text-xs text-muted-foreground">{row.helper}</div>
			</div>
			<div className="shrink-0 font-semibold">{formatNumber(row.count)}</div>
		</div>
	);
}

function OperationsPanel({
	operations,
}: {
	operations: {
		activeScrapeSources: number;
		scrapeRuns: number;
		completedScrapeRuns: number;
		failedScrapeRuns: number;
		importedMemberships: number;
		claimedProfiles: number;
		sponsors: number;
		sponsoredEvents: number;
		relationships: number;
	};
}) {
	const rows = [
		["scrape sources activos", operations.activeScrapeSources],
		["scrape runs", operations.scrapeRuns],
		["scrape runs ok", operations.completedScrapeRuns],
		["scrape runs fallidos", operations.failedScrapeRuns],
		["memberships", operations.importedMemberships],
		["perfiles reclamados", operations.claimedProfiles],
		["sponsors", operations.sponsors],
		["eventos con sponsors", operations.sponsoredEvents],
		["relaciones org", operations.relationships],
	] as const;

	return (
		<section className="border bg-card">
			<div className="flex items-center gap-2 border-b px-4 py-3">
				<Database className="size-4 text-muted-foreground" />
				<h2 className="text-sm font-semibold">Operaciones</h2>
			</div>
			<div className="divide-y">
				{rows.map(([label, value]) => (
					<div
						key={label}
						className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
					>
						<span className="text-muted-foreground">{label}</span>
						<span className="font-semibold">{formatNumber(value)}</span>
					</div>
				))}
			</div>
		</section>
	);
}
