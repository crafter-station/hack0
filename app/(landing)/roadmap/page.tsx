import {
	Check,
	Circle,
	Github,
	Globe,
	Heart,
	Rocket,
	Target,
	Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { getCountriesWithEvents } from "@/lib/actions/events";
import { getCountryFlag, getCountryName } from "@/lib/event-utils";

export const metadata: Metadata = {
	title: "Roadmap",
	description:
		"Conoce nuestras prioridades y visión para mapear el ecosistema tech de LATAM, empezando por Perú.",
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

const ALL_LATAM_COUNTRIES = [
	"PE",
	"GT",
	"CO",
	"CL",
	"MX",
	"AR",
	"BR",
	"EC",
	"BO",
	"UY",
	"PY",
	"VE",
	"CR",
	"PA",
	"DO",
	"SV",
	"HN",
	"NI",
	"CU",
	"PR",
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

export default async function RoadmapPage() {
	const activeCountries = await getCountriesWithEvents();
	const countries = ALL_LATAM_COUNTRIES.map((code) => ({
		code,
		name: getCountryName(code),
		flag: getCountryFlag(code),
		status: activeCountries.includes(code)
			? ("active" as const)
			: ("future" as const),
	}));
	const sortedCountries = [
		...countries.filter((c) => c.status === "active"),
		...countries.filter((c) => c.status === "future"),
	];

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
							<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
								Construyendo el mapa del ecosistema tech de LATAM
							</h1>
							<p className="text-muted-foreground mt-4 text-lg">
								Nuestra misión es dar visibilidad a todas las comunidades y
								eventos tech de Latinoamérica. Empezamos por Perú, pero la
								visión es regional.
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

						<div className="grid gap-8 md:grid-cols-2">
							<div className="space-y-4">
								<p className="text-muted-foreground">
									hack0.dev es un proyecto open source con eventos activos en{" "}
									<strong className="text-foreground">
										{activeCountries.length}{" "}
										{activeCountries.length === 1 ? "país" : "países"}
									</strong>{" "}
									de Latinoamérica. La arquitectura está diseñada para escalar a
									toda la región.
								</p>
								<p className="text-muted-foreground">
									Si quieres llevar esta iniciativa a tu país, eres bienvenido.
									Puedes contribuir al código, adaptar la plataforma, o
									simplemente empezar a agregar eventos de tu región.
								</p>
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
								</div>
							</div>

							<div className="space-y-3">
								{sortedCountries.map((country) => (
									<div
										key={country.code}
										className="flex items-center justify-between p-3 rounded-lg border"
									>
										<div className="flex items-center gap-3">
											<span className="text-2xl">{country.flag}</span>
											<span className="font-medium">{country.name}</span>
										</div>
										{country.status === "active" ? (
											<Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
												Activo
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-muted-foreground"
											>
												Próximamente
											</Badge>
										)}
									</div>
								))}
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
