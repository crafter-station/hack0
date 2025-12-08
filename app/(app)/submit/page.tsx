import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SubmitEventForm } from "@/components/events/submit-event-form";

export default function SubmitEventPage() {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader showBackButton />

			{/* Content */}
			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-12 flex-1 w-full">
				<div className="grid lg:grid-cols-[1fr_2fr] gap-12">
					{/* Sidebar */}
					<div className="lg:sticky lg:top-28 lg:self-start space-y-4">
						<h1 className="text-2xl font-semibold tracking-tight">
							Agregar evento
						</h1>
						<p className="text-muted-foreground">
							Comparte un hackathon, conferencia o evento tech con la comunidad peruana.
						</p>
						<div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
							<p>Los eventos son revisados antes de publicarse.</p>
							<p>Te notificaremos por email cuando esté aprobado.</p>
						</div>
					</div>

					{/* Form */}
					<div>
						<SubmitEventForm />
					</div>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
