import { XCircle } from "lucide-react";
import Link from "next/link";

interface PageProps {
	searchParams: Promise<{ reason?: string }>;
}

export default async function SubscribeErrorPage({ searchParams }: PageProps) {
	const { reason } = await searchParams;

	const getMessage = () => {
		switch (reason) {
			case "missing-token":
				return "El enlace de verificación es inválido.";
			case "invalid-token":
				return "El enlace de verificación ha expirado o ya fue usado.";
			default:
				return "Ocurrió un error al verificar tu suscripción.";
		}
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="max-w-md w-full text-center space-y-6">
				<div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
					<XCircle className="h-8 w-8 text-red-500" />
				</div>

				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						Error de verificación
					</h1>
					<p className="text-muted-foreground">{getMessage()}</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<Link
						href="/"
						className="inline-flex h-10 items-center justify-center rounded-md border border-border px-6 text-sm font-medium transition-colors hover:bg-muted"
					>
						Volver al inicio
					</Link>
				</div>
			</div>
		</div>
	);
}
