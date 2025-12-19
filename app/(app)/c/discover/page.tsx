import { auth } from "@clerk/nextjs/server";
import { BadgeCheck, Search } from "lucide-react";
import { DiscoverOrganizationList } from "@/components/communities/discover-organization-list";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
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

			<section className="sticky top-11 z-40 border-b bg-background/95 backdrop-blur-md">
				<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
					<form className="flex items-center gap-2 py-2" action="/c/discover">
						<div className="relative max-w-[200px]">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
							<input
								type="text"
								name="search"
								defaultValue={params.search}
								placeholder="Buscar..."
								className="w-full h-7 pl-8 pr-3 rounded-md border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
							/>
						</div>
						<select
							name="type"
							defaultValue={params.type || ""}
							className="h-7 px-2 rounded-md border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
						>
							<option value="">Tipo</option>
							<option value="community">Comunidad</option>
							<option value="university">Universidad</option>
							<option value="company">Empresa</option>
							<option value="government">Gobierno</option>
							<option value="ngo">ONG</option>
							<option value="accelerator">Aceleradora</option>
						</select>
						<label className="flex items-center gap-1.5 h-7 px-2 rounded-md border bg-background text-xs cursor-pointer hover:bg-muted transition-colors">
							<input
								type="checkbox"
								name="verified"
								value="true"
								defaultChecked={params.verified === "true"}
								className="h-3 w-3 rounded"
							/>
							<BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
							<span className="hidden sm:inline">Verificadas</span>
						</label>
						<button
							type="submit"
							className="h-7 px-3 rounded-md bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
						>
							Filtrar
						</button>
					</form>
				</div>
			</section>

			<main className="mx-auto max-w-screen-xl px-4 lg:px-8 py-4 flex-1 w-full">
				<DiscoverOrganizationList
					organizations={communities}
					isAuthenticated={isAuthenticated}
				/>
			</main>

			<SiteFooter />
		</div>
	);
}
