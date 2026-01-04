import { User } from "lucide-react";
import { HostClaimsList } from "@/components/admin/host-claims-list";
import { getAllHostClaims } from "@/lib/actions/host-claims";

export const metadata = {
	title: "Hosts - God Mode",
	description: "Gestiona las solicitudes de host claims",
};

export default async function HostsPage() {
	const hostClaims = await getAllHostClaims();

	const pendingHosts = hostClaims.filter((c) => c.status === "pending");
	const approvedHosts = hostClaims.filter((c) => c.status === "approved");

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-4">
				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10">
							<User className="h-4 w-4 text-amber-500" />
						</div>
						<div>
							<p className="text-2xl font-semibold">{pendingHosts.length}</p>
							<p className="text-xs text-muted-foreground">Claims pendientes</p>
						</div>
					</div>
				</div>
				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10">
							<User className="h-4 w-4 text-emerald-500" />
						</div>
						<div>
							<p className="text-2xl font-semibold">{approvedHosts.length}</p>
							<p className="text-xs text-muted-foreground">Claims aprobados</p>
						</div>
					</div>
				</div>
			</div>

			<HostClaimsList title="Solicitudes de Host" claims={hostClaims} />
		</div>
	);
}
