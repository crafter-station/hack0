import Image from "next/image";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFollowedCommunitiesStats } from "@/lib/actions/feed";

export async function FollowedCommunitiesSidebar() {
	const { count, communities } = await getFollowedCommunitiesStats();

	if (count === 0) {
		return (
			<aside className="space-y-4">
				<div className="rounded-lg border bg-card p-6 space-y-4">
					<div className="flex items-center gap-2 text-muted-foreground">
						<Users className="h-5 w-5" />
						<h3 className="font-medium">Comunidades</h3>
					</div>
					<p className="text-sm text-muted-foreground">
						No sigues ninguna comunidad aún. Descubre y sigue comunidades para
						ver eventos personalizados.
					</p>
					<Link href="/c">
						<Button size="sm" className="w-full">
							<Plus className="h-4 w-4" />
							Descubrir comunidades
						</Button>
					</Link>
				</div>
			</aside>
		);
	}

	return (
		<aside className="space-y-4">
			<div className="rounded-lg border bg-card p-6 space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						<h3 className="font-medium">Comunidades ({count})</h3>
					</div>
					<Link href="/c">
						<Button variant="ghost" size="sm">
							<Plus className="h-4 w-4" />
							Ver más
						</Button>
					</Link>
				</div>

				<div className="space-y-2">
					{communities.map((community) => (
						<Link
							key={community.id}
							href={`/c/${community.slug}`}
							className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors"
						>
							{community.logoUrl ? (
								<div className="relative h-8 w-8 rounded overflow-hidden shrink-0">
									<Image
										src={community.logoUrl}
										alt={community.name}
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
									{community.name.charAt(0)}
								</div>
							)}
							<span className="text-sm font-medium truncate">
								{community.displayName || community.name}
							</span>
						</Link>
					))}
				</div>
			</div>
		</aside>
	);
}
