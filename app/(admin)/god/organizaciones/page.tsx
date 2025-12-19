import { Building2 } from "lucide-react";
import { OrganizationsTable } from "@/components/god-mode/organizations-table";
import { getAllOrganizations } from "@/lib/actions/organizations";

export const metadata = {
	title: "Organizaciones - God Mode",
	description: "Gestiona las organizaciones y su verificación",
};

export default async function OrganizacionesPage() {
	const organizations = await getAllOrganizations();

	const verifiedOrgs = organizations.filter((org) => org.isVerified);
	const unverifiedOrgs = organizations.filter((org) => !org.isVerified);

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-3 gap-4">
				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/10">
							<Building2 className="h-4 w-4 text-blue-500" />
						</div>
						<div>
							<p className="text-2xl font-semibold">{organizations.length}</p>
							<p className="text-xs text-muted-foreground">
								Total organizaciones
							</p>
						</div>
					</div>
				</div>
				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10">
							<Building2 className="h-4 w-4 text-emerald-500" />
						</div>
						<div>
							<p className="text-2xl font-semibold">{verifiedOrgs.length}</p>
							<p className="text-xs text-muted-foreground">Verificadas</p>
						</div>
					</div>
				</div>
				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
							<Building2 className="h-4 w-4 text-muted-foreground" />
						</div>
						<div>
							<p className="text-2xl font-semibold">{unverifiedOrgs.length}</p>
							<p className="text-xs text-muted-foreground">Sin verificar</p>
						</div>
					</div>
				</div>
			</div>

			<OrganizationsTable organizations={organizations} />
		</div>
	);
}
