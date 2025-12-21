"use client";

import { UserCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { initiateHostClaim } from "@/lib/actions/host-claims";

interface ClaimHostButtonProps {
	lumaHostApiId: string;
	hostName: string;
}

export function ClaimHostButton({
	lumaHostApiId,
	hostName,
}: ClaimHostButtonProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleClaim = () => {
		startTransition(async () => {
			const result = await initiateHostClaim(lumaHostApiId);
			if (result.success) {
				toast.success("Email de verificación enviado", {
					description: "Revisa tu correo para confirmar",
				});
				setOpen(false);
			} else {
				toast.error(result.error);
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="gap-1.5 text-xs">
					<UserCheck className="h-3.5 w-3.5" />
					Reclamar
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Reclamar perfil de host</DialogTitle>
					<DialogDescription>
						¿Eres <strong>{hostName}</strong> en Luma? Confirma tu identidad
						para vincular este perfil a tu cuenta de Hack0.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<p className="text-sm text-muted-foreground">
						Te enviaremos un email de verificación. Una vez confirmado, podrás:
					</p>
					<ul className="mt-2 space-y-1 text-sm">
						<li>• Gestionar los eventos donde eres host</li>
						<li>• Recibir notificaciones de tus eventos</li>
						<li>• Aparecer como organizador verificado</li>
					</ul>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancelar
					</Button>
					<Button onClick={handleClaim} disabled={isPending}>
						{isPending ? "Enviando..." : "Enviar verificación"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
