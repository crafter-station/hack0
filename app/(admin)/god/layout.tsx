import { Zap } from "lucide-react";
import { redirect } from "next/navigation";
import { GodModeNav } from "@/components/god-mode/god-mode-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { isGodMode } from "@/lib/god-mode";

export const dynamic = "force-dynamic";

interface GodLayoutProps {
	children: React.ReactNode;
}

export default async function GodLayout({ children }: GodLayoutProps) {
	const godMode = await isGodMode();

	if (!godMode) {
		redirect("/");
	}

	const tabs = [
		{ id: "eventos", label: "Eventos", href: "/god/eventos" },
		{ id: "pendientes", label: "Sin Org", href: "/god/pendientes" },
		{ id: "victorias", label: "Victorias", href: "/god/victorias" },
		{
			id: "organizaciones",
			label: "Organizaciones",
			href: "/god/organizaciones",
		},
	];

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<div className="border-b bg-muted/30">
				<div className="mx-auto max-w-7xl px-4 lg:px-8">
					<div className="flex items-center justify-between gap-4 py-4">
						<div className="flex items-center gap-3 min-w-0">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
								<Zap className="h-5 w-5 fill-white" />
							</div>
							<div className="space-y-1">
								<h1 className="text-xl font-semibold tracking-tight">
									God Mode
								</h1>
								<p className="text-sm text-muted-foreground">
									Panel de administración del sistema
								</p>
							</div>
						</div>
					</div>

					<GodModeNav tabs={tabs} />
				</div>
			</div>

			<main className="flex-1 mx-auto max-w-7xl w-full px-4 lg:px-8 py-8">
				{children}
			</main>

			<SiteFooter />
		</div>
	);
}
