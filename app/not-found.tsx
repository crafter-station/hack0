import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
			<div className="max-w-md w-full text-center space-y-6">
				<div className="space-y-2">
					<Link href="/" className="inline-flex items-center gap-2 mb-4">
						<span className="flex items-center">
							<span className="text-sm font-semibold tracking-tight">
								hack0
							</span>
							<span className="text-sm text-muted-foreground">.dev</span>
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
