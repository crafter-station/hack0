import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function ForOrganizersPage() {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<main className="flex-1 mx-auto max-w-screen-xl px-4 lg:px-8 py-8 md:py-12">
				{/* Bento Grid */}
				<div className="grid gap-3 md:grid-cols-3 md:grid-rows-[auto_auto_auto]">
					{/* Hero - Spans 2 cols */}
					<div className="relative md:col-span-2 rounded-2xl border border-border p-6 md:p-8 overflow-hidden">
						<div
							className="absolute inset-0 opacity-[0.03]"
							style={{
								backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
								backgroundSize: "32px 32px",
							}}
						/>
						<div className="relative">
							<p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
								Para organizadores
							</p>
							<h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
								Publica tus eventos
								<br />
								<span className="text-muted-foreground">en Perú</span>
							</h1>
							<p className="text-muted-foreground mt-3 text-sm max-w-md">
								Hackathons, conferencias, workshops. Gratis, sin fricción.
							</p>
							<div className="flex items-center gap-3 mt-6">
								<Link
									href="/sign-up"
									className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
								>
									Empezar
									<ArrowRight className="h-3.5 w-3.5" />
								</Link>
								<Link
									href="/sign-in"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									Ya tengo cuenta
								</Link>
							</div>
						</div>
					</div>

					{/* Stats card */}
					<div className="rounded-2xl border border-border p-6 flex flex-col justify-between bg-muted/30">
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							Gratis
						</p>
						<div className="mt-4">
							<p className="text-4xl font-semibold tabular-nums">$0</p>
							<p className="text-sm text-muted-foreground mt-1">
								Sin límites de eventos
							</p>
						</div>
					</div>

					{/* Steps - 3 small cards */}
					<div className="rounded-2xl border border-border p-5 bg-background">
						<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
							1
						</span>
						<p className="text-sm font-medium mt-3">Crea tu cuenta</p>
						<p className="text-xs text-muted-foreground mt-1">Email o Google</p>
					</div>

					<div className="rounded-2xl border border-border p-5 bg-background">
						<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
							2
						</span>
						<p className="text-sm font-medium mt-3">Configura tu org</p>
						<p className="text-xs text-muted-foreground mt-1">
							Nombre, logo, tipo
						</p>
					</div>

					<div className="rounded-2xl border border-border p-5 bg-background">
						<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
							3
						</span>
						<p className="text-sm font-medium mt-3">Publica eventos</p>
						<p className="text-xs text-muted-foreground mt-1">
							Dashboard simple
						</p>
					</div>

					{/* Event types - Spans 2 cols */}
					<div className="md:col-span-2 rounded-2xl border border-border p-5">
						<p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
							Tipos de eventos
						</p>
						<div className="flex flex-wrap gap-2">
							{[
								"Hackathons",
								"Conferencias",
								"Workshops",
								"Meetups",
								"Bootcamps",
								"Olimpiadas",
								"Aceleradoras",
								"Cursos",
							].map((type) => (
								<span
									key={type}
									className="rounded-full border border-border px-3 py-1 text-xs"
								>
									{type}
								</span>
							))}
						</div>
					</div>

					{/* Who publishes */}
					<div className="rounded-2xl border border-border p-5 bg-muted/30">
						<p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
							Quiénes publican
						</p>
						<div className="space-y-1.5 text-sm">
							<p>Comunidades</p>
							<p>Universidades</p>
							<p>Empresas</p>
							<p>Startups</p>
						</div>
					</div>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
