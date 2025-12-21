import { AlertCircle, Building2 } from "lucide-react";
import { PendingOrgEvents } from "@/components/admin/pending-org-events";
import {
	getAllOrganizationsForSelect,
	getEventsWithoutOrg,
} from "@/lib/actions/pending-events";

export const metadata = {
	title: "Eventos sin Org - God Mode",
	description: "Asigna organizaciones a eventos huérfanos",
};

export default async function PendientesPage() {
	const [pendingEvents, organizations] = await Promise.all([
		getEventsWithoutOrg(),
		getAllOrganizationsForSelect(),
	]);

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-4">
				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10">
							<AlertCircle className="h-4 w-4 text-amber-500" />
						</div>
						<div>
							<p className="text-2xl font-semibold">{pendingEvents.length}</p>
							<p className="text-xs text-muted-foreground">Sin organización</p>
						</div>
					</div>
				</div>
				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/10">
							<Building2 className="h-4 w-4 text-blue-500" />
						</div>
						<div>
							<p className="text-2xl font-semibold">{organizations.length}</p>
							<p className="text-xs text-muted-foreground">
								Orgs disponibles
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="rounded-lg border bg-card">
				<div className="border-b px-4 py-3">
					<h2 className="font-medium">Eventos sin organización</h2>
					<p className="text-sm text-muted-foreground">
						Eventos importados de Luma que no pudieron ser asignados
						automáticamente
					</p>
				</div>
				<div className="p-4">
					<PendingOrgEvents
						events={pendingEvents}
						organizations={organizations}
					/>
				</div>
			</div>
		</div>
	);
}
