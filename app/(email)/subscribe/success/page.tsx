import { CheckCircle } from "lucide-react";
import Link from "next/link";

interface PageProps {
	searchParams: Promise<{ already?: string }>;
}

export default async function SubscribeSuccessPage({
	searchParams,
}: PageProps) {
	const { already } = await searchParams;

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="max-w-md w-full text-center space-y-6">
				<div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
					<CheckCircle className="h-8 w-8 text-green-500" />
				</div>

				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						{already ? "Ya estás suscrito" : "Suscripción confirmada"}
					</h1>
					<p className="text-muted-foreground">
						{already
							? "Tu email ya estaba verificado. Recibirás notificaciones cuando publiquemos nuevos eventos."
							: "Recibirás notificaciones por email cuando publiquemos nuevos eventos tech en Perú."}
					</p>
				</div>

				<Link
					href="/"
					className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
				>
					Ver eventos
				</Link>
			</div>
		</div>
	);
}
