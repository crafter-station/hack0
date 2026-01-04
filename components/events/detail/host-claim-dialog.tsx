"use client";

import { UserIcon } from "lucide-react";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createHostClaim } from "@/lib/actions/host-claims";

interface HostClaimDialogProps {
	eventHostId: string;
	hostName: string;
	children: React.ReactNode;
}

export function HostClaimDialog({
	eventHostId,
	hostName,
	children,
}: HostClaimDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const [proofUrl, setProofUrl] = useState("");
	const [proofDescription, setProofDescription] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		if (!proofUrl) {
			setError("El enlace de prueba es obligatorio");
			setLoading(false);
			return;
		}

		const result = await createHostClaim({
			eventHostId,
			proofUrl,
			proofDescription: proofDescription || undefined,
		});

		setLoading(false);

		if (result.success) {
			setSuccess(true);
		} else {
			setError(result.error || "Error al enviar la solicitud");
		}
	};

	const handleClose = () => {
		setOpen(false);
		setSuccess(false);
		setProofUrl("");
		setProofDescription("");
		setError(null);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}
		>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				{success ? (
					<>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<UserIcon className="h-5 w-5 text-emerald-500" />
								Solicitud enviada
							</DialogTitle>
							<DialogDescription>
								Tu solicitud para reclamar el perfil de host ha sido enviada. Un
								administrador la revisará pronto.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button onClick={handleClose}>Cerrar</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<UserIcon className="h-5 w-5 text-blue-500" />
								Reclamar perfil de host
							</DialogTitle>
							<DialogDescription>
								¿Eres <strong>{hostName}</strong>? Envía una prueba para
								vincular este perfil de host a tu cuenta.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="proofUrl">
									Enlace de prueba <span className="text-red-500">*</span>
								</Label>
								<Input
									id="proofUrl"
									type="url"
									value={proofUrl}
									onChange={(e) => setProofUrl(e.target.value)}
									placeholder="https://..."
									required
								/>
								<p className="text-xs text-muted-foreground">
									Link a tu perfil de LinkedIn, red social donde apareces como
									host, o cualquier prueba que demuestre tu identidad
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="proofDescription">
									Descripción adicional (opcional)
								</Label>
								<Textarea
									id="proofDescription"
									value={proofDescription}
									onChange={(e) => setProofDescription(e.target.value)}
									placeholder="Información adicional que ayude a verificar tu identidad..."
									rows={3}
								/>
							</div>

							{error && <p className="text-sm text-red-500">{error}</p>}

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={handleClose}
									disabled={loading}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={loading}>
									{loading ? "Enviando..." : "Enviar solicitud"}
								</Button>
							</DialogFooter>
						</form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
