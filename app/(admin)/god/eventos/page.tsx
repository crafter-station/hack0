import { getAllWinnerClaims } from "@/lib/actions/claims";
import { getEventsByApprovalStatus } from "@/lib/actions/events";
import { PendingEventsList } from "@/components/admin/pending-events-list";
import { Calendar } from "lucide-react";

export const metadata = {
	title: "Eventos - God Mode",
	description: "Gestiona las solicitudes de eventos",
};

export default async function EventosPage() {
	const allEvents = await getEventsByApprovalStatus("all");

	const pendingEvents = allEvents.filter((e) => e.approvalStatus === "pending");
	const approvedEvents = allEvents.filter((e) => e.approvalStatus === "approved");

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-4">
				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10">
							<Calendar className="h-4 w-4 text-amber-500" />
						</div>
						<div>
							<p className="text-2xl font-semibold">{pendingEvents.length}</p>
							<p className="text-xs text-muted-foreground">Eventos pendientes</p>
						</div>
					</div>
				</div>
				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10">
							<Calendar className="h-4 w-4 text-emerald-500" />
						</div>
						<div>
							<p className="text-2xl font-semibold">{approvedEvents.length}</p>
							<p className="text-xs text-muted-foreground">Eventos aprobados</p>
						</div>
					</div>
				</div>
			</div>

			<PendingEventsList events={allEvents} />
		</div>
	);
}
