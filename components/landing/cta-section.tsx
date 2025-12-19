import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SubscribeForm } from "@/components/subscribe-form";

export function CTASection() {
	return (
		<section className="border-t py-16 md:py-20">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8 text-center">
				<h2 className="text-2xl font-semibold">
					Unete a la comunidad de builders
				</h2>
				<p className="text-muted-foreground mt-2 max-w-md mx-auto">
					Recibe notificaciones de nuevos eventos y conecta con otros builders
					en Peru.
				</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
					<SubscribeForm />
					<Link
						href="/for-organizers"
						className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Soy organizador
						<ArrowRight className="h-3.5 w-3.5" />
					</Link>
				</div>
			</div>
		</section>
	);
}
