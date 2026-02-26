"use client";

import { CheckCircle2, UserPlus, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptTeamInvite, declineTeamInvite } from "@/lib/actions/submissions";

interface TeamInviteAcceptProps {
	token: string;
	eventCode: string;
}

export function TeamInviteAccept({ token, eventCode }: TeamInviteAcceptProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<"accepted" | "declined" | null>(null);

	async function handleAccept() {
		setLoading(true);
		const res = await acceptTeamInvite(token);
		setLoading(false);

		if (res.success) {
			setResult("accepted");
			toast.success("Te uniste al equipo");
			setTimeout(() => router.push(`/e/${eventCode}/submit`), 1500);
		} else {
			toast.error(res.error ?? "Error al aceptar la invitación");
		}
	}

	async function handleDecline() {
		setLoading(true);
		const res = await declineTeamInvite(token);
		setLoading(false);

		if (res.success) {
			setResult("declined");
			toast.success("Invitación rechazada");
			setTimeout(() => router.push(`/e/${eventCode}`), 1500);
		} else {
			toast.error(res.error ?? "Error al rechazar la invitación");
		}
	}

	if (result === "accepted") {
		return (
			<div className="text-center space-y-4">
				<CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
				<h1 className="text-2xl font-bold">Te uniste al equipo</h1>
				<p className="text-muted-foreground">
					Redirigiendo a la página de entrega...
				</p>
			</div>
		);
	}

	if (result === "declined") {
		return (
			<div className="text-center space-y-4">
				<XCircle className="h-16 w-16 text-muted-foreground mx-auto" />
				<h1 className="text-2xl font-bold">Invitación rechazada</h1>
				<p className="text-muted-foreground">Redirigiendo...</p>
			</div>
		);
	}

	return (
		<div className="rounded-lg border bg-card p-8 text-center space-y-6">
			<UserPlus className="h-16 w-16 text-muted-foreground mx-auto" />
			<div>
				<h1 className="text-2xl font-bold">Invitación de equipo</h1>
				<p className="text-muted-foreground mt-2">
					Te han invitado a unirte a un equipo para este hackathon.
				</p>
			</div>

			<div className="flex items-center justify-center gap-3">
				<Button onClick={handleAccept} disabled={loading} size="lg">
					Aceptar invitación
				</Button>
				<Button
					variant="outline"
					onClick={handleDecline}
					disabled={loading}
					size="lg"
				>
					Rechazar
				</Button>
			</div>
		</div>
	);
}
