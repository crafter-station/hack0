import Link from "next/link";
import { Hack0Wordmark } from "@/components/brand/hack0-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
			<div className="max-w-md w-full text-center space-y-6">
				<div className="space-y-2">
					<Link href="/" className="mb-4 inline-flex items-end gap-1">
						<Hack0Wordmark className="h-7 w-[98px]" />
						<span className="pb-[2px] font-mono text-sm text-muted-foreground">
							.dev
						</span>
					</Link>
					<h1 className="text-4xl font-semibold tracking-tight">404</h1>
					<p className="text-lg text-muted-foreground">Página no encontrada</p>
				</div>

				<p className="text-sm text-muted-foreground">
					La página que buscas no existe o ha sido movida.
				</p>

				<Button asChild className="mt-6">
					<Link href="/">Volver al inicio</Link>
				</Button>
			</div>
		</div>
	);
}
