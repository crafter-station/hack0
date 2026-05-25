import {
	CalendarDays,
	Check,
	Circle,
	Github,
	Globe,
	Heart,
	type LucideIcon,
	Network,
	Rocket,
	Target,
	Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import {
	getLatamCountryCoverage,
	type LatamCountryCoverage,
} from "@/lib/latam-country-coverage";

export const metadata: Metadata = {
	title: "Roadmap",
	description:
		"Conoce nuestras prioridades y visión para mapear el ecosistema tech de LATAM.",
};

const phases = [
	{
		title: "Fase 1: Fundamentos",
		status: "completed" as const,
		description: "Construir la base de la plataforma",
		items: [
			{ text: "Calendario de eventos tech", done: true },
			{ text: "Sistema de comunidades/organizaciones", done: true },
			{ text: "Publicación de eventos gratuita", done: true },
			{ text: "Páginas de detalle de eventos", done: true },
			{ text: "Filtros por tipo, formato y ubicación", done: true },
		],
	},
	{
		title: "Fase 2: Comunidades + Multi-país",
		status: "in_progress" as const,
		description: "Empoderar organizadores y expandir a LATAM",
		items: [
			{ text: "Perfiles de comunidad personalizables", done: true },
			{ text: "Integración con Luma Calendar", done: true },
			{ text: "Co-hosts y colaboradores en eventos", done: true },
			{ text: "Soporte multi-país con timezones reales", done: true },
			{ text: "Filtro por país y banderas correctas", done: true },
			{ text: "Dashboard para organizadores", done: false },
			{ text: "Analytics básicos de eventos", done: false },
		],
	},
	{
		title: "Fase 3: Descubrimiento",
		status: "planned" as const,
		description: "Facilitar encontrar eventos relevantes",
		items: [
			{ text: "Notificaciones por email personalizadas", done: false },
			{ text: "Recomendaciones basadas en intereses", done: false },
			{ text: "Vista de mapa geográfico interactivo", done: false },
			{ text: "Calendario personal sincronizable", done: false },
			{ text: "API pública para desarrolladores", done: false },
		],
	},
	{
		title: "Fase 4: Ecosistema",
		status: "planned" as const,
		description: "Mapear completamente el ecosistema",
		items: [
			{ text: "Directorio de comunidades tech", done: false },
			{ text: "Perfiles de speakers y mentores", done: false },
			{ text: "Historial y logros de participantes", done: false },
			{ text: "Conexiones entre comunidades", done: false },
			{ text: "Reportes del ecosistema tech", done: false },
		],
	},
];

function StatusBadge({
	status,
}: {
	status: "completed" | "in_progress" | "planned";
}) {
	if (status === "completed") {
		return (
			<Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
				Completado
			</Badge>
		);
	}
	if (status === "in_progress") {
		return (
			<Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
				En progreso
			</Badge>
		);
	}
	return <Badge className="bg-muted text-muted-foreground">Planeado</Badge>;
}

function formatNumber(value: number) {
	return new Intl.NumberFormat("es-PE").format(value);
}

function formatEntityCount(value: number, singular: string, plural: string) {
	return `${formatNumber(value)} ${value === 1 ? singular : plural}`;
}

function CoverageStat({
	icon: Icon,
	label,
	value,
}: {
	icon: LucideIcon;
	label: string;
	value: number | string;
}) {
	return (
		<div className="border bg-background p-3">
			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				<Icon className="size-3.5" />
				{label}
			</div>
			<div className="mt-2 text-xl font-semibold">{value}</div>
		</div>
	);
}

function CountryCoverageTile({
	country,
	maxSignal,
}: {
	country: LatamCountryCoverage;
	maxSignal: number;
}) {
	const hasSignal = country.signal > 0;
	const width = hasSignal
		? `${Math.max(10, Math.round((country.signal / maxSignal) * 100))}%`
		: "0%";

	return (
		<Link
			href={`/events?country=${country.code}`}
			className="group border bg-background p-3 transition-colors hover:bg-card"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-xl leading-none">{country.flag}</span>
						<span className="truncate text-sm font-medium">{country.name}</span>
					</div>
					<div className="mt-2 text-xs text-muted-foreground">
						{hasSignal
							? `${formatEntityCount(country.events, "evento", "eventos")} · ${formatEntityCount(country.communities, "comunidad", "comunidades")}`
							: "Listo para activar con comunidades locales"}
					</div>
				</div>
				<span
					className={`shrink-0 text-[10px] ${
						hasSignal ? "text-emerald-500" : "text-muted-foreground"
					}`}
				>
					{hasSignal ? "Con señal" : "Por mapear"}
				</span>
			</div>
			<div className="mt-3 h-1 bg-muted">
				<div className="h-full bg-emerald-500" style={{ width }} />
			</div>
		</Link>
	);
}

export default async function RoadmapPage() {
	const countryCoverage = await getLatamCountryCoverage();
	const activeCountries = countryCoverage.filter(
		(country) => country.signal > 0,
	);
	const totalEvents = countryCoverage.reduce(
		(total, country) => total + country.events,
		0,
	);
	const totalCommunities = countryCoverage.reduce(
		(total, country) => total + country.communities,
		0,
	);
	const maxSignal = Math.max(
		1,
		...countryCoverage.map((country) => country.signal),
	);

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<main className="flex-1">
				<section className="border-b py-16 md:py-24">
					<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
						<div className="max-w-2xl">
							<Badge variant="outline" className="mb-4">
								<Rocket className="h-3 w-3 mr-1" />
								Roadmap
							</Badge>
							<h1 className="text-3xl md:text-4xl font-bold">
								Construyendo el mapa del ecosistema tech de LATAM
							</h1>
							<p className="text-muted-foreground mt-4 text-lg">
								Nuestra misión es dar visibilidad a todas las comunidades y
								eventos tech de Latinoamérica, país por país, desde una base de
								datos abierta y accionable.
							</p>
						</div>
					</div>
				</section>

				<section className="py-12 md:py-16">
					<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
						<div className="flex items-center gap-2 mb-8">
							<Target className="h-5 w-5 text-muted-foreground" />
							<h2 className="text-xl font-semibold">Prioridades</h2>
						</div>

						<div className="grid gap-6 md:grid-cols-2">
							{phases.map((phase, index) => (
								<div key={index} className="rounded-lg border p-6 space-y-4">
									<div className="flex items-start justify-between gap-4">
										<div>
											<h3 className="font-semibold">{phase.title}</h3>
											<p className="text-sm text-muted-foreground mt-1">
												{phase.description}
											</p>
										</div>
										<StatusBadge status={phase.status} />
									</div>
									<ul className="space-y-2">
										{phase.items.map((item, itemIndex) => (
											<li
												key={itemIndex}
												className="flex items-center gap-2 text-sm"
											>
												{item.done ? (
													<Check className="h-4 w-4 text-emerald-500 shrink-0" />
												) : (
													<Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
												)}
												<span
													className={
														item.done
															? "text-foreground"
															: "text-muted-foreground"
													}
												>
													{item.text}
												</span>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</div>
				</section>

				<section id="latam" className="py-12 md:py-16 border-t scroll-mt-20">
					<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
						<div className="flex items-center gap-2 mb-8">
							<Globe className="h-5 w-5 text-muted-foreground" />
							<h2 className="text-xl font-semibold">Visión LATAM</h2>
						</div>

						<div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
							<div className="space-y-4">
								<h3 className="text-2xl font-semibold">
									LATAM-first desde el producto
								</h3>
								<p className="text-muted-foreground leading-7">
									hack0.dev parte desde una tesis regional: cualquier comunidad
									de LATAM debe poder publicar eventos, aparecer en el mapa y
									atraer builders locales sin depender de un hub central.
								</p>
								<p className="text-muted-foreground leading-7">
									La cobertura actual marca dónde ya tenemos señal y dónde falta
									backfilling. La meta es que cada país tenga eventos,
									comunidades, labs, grants y builders conectados entre sí.
								</p>
								<div className="grid gap-2 sm:grid-cols-3">
									<CoverageStat
										icon={Globe}
										label="Países soportados"
										value={countryCoverage.length}
									/>
									<CoverageStat
										icon={CalendarDays}
										label="Eventos indexados"
										value={formatNumber(totalEvents)}
									/>
									<CoverageStat
										icon={Network}
										label="Comunidades"
										value={formatNumber(totalCommunities)}
									/>
								</div>
								<div className="flex items-center gap-4 pt-4">
									<Link
										href="https://github.com/crafter-station/hack0"
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted"
									>
										<Github className="h-4 w-4" />
										Ver en GitHub
									</Link>
									<Link
										href="/c/new"
										className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
									>
										<Users className="h-4 w-4" />
										Mapear comunidad
									</Link>
								</div>
							</div>

							<div className="border bg-muted/20 p-3">
								<div className="mb-3 flex items-center justify-between gap-4 px-1">
									<div>
										<h3 className="text-sm font-semibold">
											Cobertura regional
										</h3>
										<p className="mt-1 text-xs text-muted-foreground">
											{activeCountries.length}/{countryCoverage.length} países
											con señal actual
										</p>
									</div>
									<Badge variant="outline" className="rounded-none">
										LATAM
									</Badge>
								</div>
								<div className="grid gap-2 sm:grid-cols-2">
									{countryCoverage.map((country) => (
										<CountryCoverageTile
											key={country.code}
											country={country}
											maxSignal={maxSignal}
										/>
									))}
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="py-12 md:py-16 border-t">
					<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
						<div className="max-w-2xl mx-auto text-center">
							<Heart className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
							<h2 className="text-xl font-semibold">¿Quieres colaborar?</h2>
							<p className="text-muted-foreground mt-2">
								hack0.dev es construido por la comunidad, para la comunidad. Si
								tienes ideas, feedback, o quieres contribuir código, nos
								encantaría escucharte.
							</p>
							<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
								<Link
									href="/onboarding"
									className="inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
								>
									<Users className="h-4 w-4" />
									Crear comunidad
								</Link>
								<Link
									href="https://github.com/crafter-station/hack0"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex h-11 items-center gap-2 rounded-lg border px-5 text-sm font-medium transition-colors hover:bg-muted"
								>
									<Github className="h-4 w-4" />
									Contribuir en GitHub
								</Link>
							</div>
						</div>
					</div>
				</section>
			</main>

			<SiteFooter />
		</div>
	);
}
