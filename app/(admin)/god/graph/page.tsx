import { Suspense } from "react";
import { EcosystemGraphContainer } from "@/components/god-mode/ecosystem-graph-container";
import { getEcosystemGraph } from "@/lib/actions/organization-relationships";

export const dynamic = "force-dynamic";

interface GraphPageProps {
	searchParams: Promise<{
		org?: string;
		type?: string;
		department?: string;
		verified?: string;
	}>;
}

export default async function GraphPage({ searchParams }: GraphPageProps) {
	const params = await searchParams;

	const graphData = await getEcosystemGraph({
		orgType: params.type,
		department: params.department,
		onlyVerified: params.verified === "true",
		includePrivate: true,
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold tracking-tight">
						Ecosistema Tech Peruano
					</h2>
					<p className="text-sm text-muted-foreground">
						Visualización de relaciones entre organizaciones
					</p>
				</div>
			</div>

			<Suspense
				fallback={
					<div className="h-[600px] border border-border rounded-lg bg-muted/20 animate-pulse flex items-center justify-center">
						<span className="text-muted-foreground text-sm">
							Cargando grafo...
						</span>
					</div>
				}
			>
				<EcosystemGraphContainer
					initialData={graphData}
					selectedOrgId={params.org}
				/>
			</Suspense>
		</div>
	);
}
