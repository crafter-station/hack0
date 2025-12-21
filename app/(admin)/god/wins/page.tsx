import { AdminClaimsList } from "@/components/admin/claims-list";
import { TrophyIcon } from "@/components/icons/trophy";
import { getAllWinnerClaims } from "@/lib/actions/claims";

export const metadata = {
	title: "Victorias - God Mode",
	description: "Gestiona las solicitudes de victorias",
};

export default async function VictoriasPage() {
	const winnerClaims = await getAllWinnerClaims();

	const pendingWinners = winnerClaims.filter((c) => c.status === "pending");
	const approvedWinners = winnerClaims.filter((c) => c.status === "approved");

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-4">
				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10">
							<TrophyIcon className="h-4 w-4 text-amber-500" />
						</div>
						<div>
							<p className="text-2xl font-semibold">{pendingWinners.length}</p>
							<p className="text-xs text-muted-foreground">
								Victorias pendientes
							</p>
						</div>
					</div>
				</div>
				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10">
							<TrophyIcon className="h-4 w-4 text-emerald-500" />
						</div>
						<div>
							<p className="text-2xl font-semibold">{approvedWinners.length}</p>
							<p className="text-xs text-muted-foreground">
								Victorias aprobadas
							</p>
						</div>
					</div>
				</div>
			</div>

			<AdminClaimsList
				title="Solicitudes de Victorias"
				type="winner"
				claims={winnerClaims}
			/>
		</div>
	);
}
