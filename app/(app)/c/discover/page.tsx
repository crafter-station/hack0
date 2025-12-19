import { auth } from "@clerk/nextjs/server";
import { BadgeCheck, Search, Users } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { DiscoverCommunityCard } from "@/components/communities/discover-community-card";
import { getPublicCommunities } from "@/lib/actions/communities";

interface DiscoverPageProps {
	searchParams: Promise<{
		search?: string;
		type?: string;
		verified?: string;
		order?: string;
	}>;
}

export const metadata = {
	title: "Explorar Comunidades | hack0",
	description:
		"Descubre comunidades de tecnología, hackathons y eventos en Perú. Únete a la comunidad tech más activa.",
};

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
	const { userId } = await auth();
	const params = await searchParams;

	const communities = await getPublicCommunities({
		search: params.search,
		type: params.type,
		verifiedOnly: params.verified === "true",
		orderBy: (params.order as "popular" | "recent" | "name") || "popular",
	});

	const isAuthenticated = !!userId;

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<SiteHeader />

			<main className="flex-1">
				<div className="mx-auto max-w-4xl px-4 lg:px-8 py-8">
					<div className="space-y-6">
						<div className="flex flex-col gap-4">
							<div className="flex items-center justify-between">
								<div>
									<h1 className="text-2xl font-bold tracking-tight">
										Explorar Comunidades
									</h1>
									<p className="text-muted-foreground mt-1">
										Encuentra y únete a comunidades tech en Perú
									</p>
								</div>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Users className="h-4 w-4" />
									<span>{communities.length} comunidades</span>
								</div>
							</div>

							<form className="flex gap-2" action="/c/discover">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<input
										type="text"
										name="search"
										defaultValue={params.search}
										placeholder="Buscar comunidades..."
										className="w-full h-10 pl-10 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
									/>
								</div>
								<select
									name="type"
									defaultValue={params.type || ""}
									className="h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								>
									<option value="">Todos los tipos</option>
									<option value="community">Comunidad</option>
									<option value="university">Universidad</option>
									<option value="company">Empresa</option>
									<option value="government">Gobierno</option>
									<option value="ngo">ONG</option>
									<option value="accelerator">Aceleradora</option>
								</select>
								<label className="flex items-center gap-2 h-10 px-3 rounded-lg border bg-background text-sm cursor-pointer hover:bg-muted transition-colors">
									<input
										type="checkbox"
										name="verified"
										value="true"
										defaultChecked={params.verified === "true"}
										className="h-4 w-4 rounded border-muted-foreground"
									/>
									<BadgeCheck className="h-4 w-4 text-emerald-500" />
									<span className="hidden sm:inline">Verificadas</span>
								</label>
								<button
									type="submit"
									className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
								>
									Buscar
								</button>
							</form>
						</div>

						{communities.length === 0 ? (
							<div className="text-center py-16">
								<Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h2 className="text-lg font-medium mb-2">
									No se encontraron comunidades
								</h2>
								<p className="text-muted-foreground text-sm">
									{params.search
										? "Intenta con otros términos de búsqueda"
										: "Aún no hay comunidades públicas disponibles"}
								</p>
							</div>
						) : (
							<div className="grid gap-4 sm:grid-cols-2">
								{communities.map((community) => (
									<DiscoverCommunityCard
										key={community.id}
										community={community}
										isAuthenticated={isAuthenticated}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
