import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { LumaIcon } from "@/components/icons/luma";

export function CTASection() {
	return (
		<section className="border-t py-16 md:py-20">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8 text-center">
				<h2 className="text-2xl font-semibold">¿Tienes una comunidad tech?</h2>
				<p className="text-muted-foreground mt-2 max-w-md mx-auto">
					Publica tus eventos gratis y dale visibilidad a tu comunidad. Sin
					límites, sin costos, sin complicaciones.
				</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
					<Link
						href="/onboarding"
						className="inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
					>
						<Plus className="h-4 w-4" />
						Publicar mi primer evento
					</Link>
					<Link
						href="/events"
						className="inline-flex h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Ver ejemplos
						<ArrowRight className="h-4 w-4" />
					</Link>
				</div>

				<div className="mt-10 pt-8 border-t border-dashed">
					<p className="text-sm text-muted-foreground">
						¿Ya usas Luma? Sube tu evento a nuestro calendario comunitario
					</p>
					<a
						href="https://lu.ma/hack0"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted mt-3"
					>
						<LumaIcon className="h-4 w-4" />
						Subir evento a lu.ma/hack0
					</a>
				</div>
			</div>
		</section>
	);
}
