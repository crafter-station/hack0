"use client";

import {
	CheckCircle2Icon,
	LinkIcon,
	Loader2Icon,
	UserIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
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
		setTimeout(() => {
			setSuccess(false);
			setProofUrl("");
			setProofDescription("");
			setError(null);
		}, 150);
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
							<div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
								<CheckCircle2Icon className="size-6 text-emerald-500" />
							</div>
							<DialogTitle className="text-center">
								Solicitud enviada
							</DialogTitle>
							<DialogDescription className="text-center">
								Tu solicitud para reclamar el perfil de host ha sido enviada. Un
								administrador la revisará pronto.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="sm:justify-center">
							<Button onClick={handleClose} className="min-w-24">
								Cerrar
							</Button>
						</DialogFooter>
					</>
				) : (
					<form onSubmit={handleSubmit}>
						<DialogHeader>
							<div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
								<UserIcon className="size-6 text-muted-foreground" />
							</div>
							<DialogTitle className="text-center">
								Reclamar perfil de host
							</DialogTitle>
							<DialogDescription className="text-center">
								¿Eres{" "}
								<span className="font-medium text-foreground">{hostName}</span>?
								Envía una prueba para vincular este perfil a tu cuenta.
							</DialogDescription>
						</DialogHeader>

						<DialogBody>
							<div className="space-y-2">
								<Label htmlFor="proofUrl" className="text-sm font-medium">
									Enlace de prueba
								</Label>
								<div className="relative">
									<LinkIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="proofUrl"
										type="url"
										value={proofUrl}
										onChange={(e) => setProofUrl(e.target.value)}
										placeholder="https://linkedin.com/in/tu-perfil"
										className="pl-9"
										required
									/>
								</div>
								<p className="text-xs text-muted-foreground">
									Link a tu perfil de LinkedIn, red social donde apareces como
									host, o cualquier prueba que demuestre tu identidad
								</p>
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="proofDescription"
									className="text-sm font-medium"
								>
									Descripción adicional
									<span className="ml-1 text-muted-foreground font-normal">
										(opcional)
									</span>
								</Label>
								<Textarea
									id="proofDescription"
									value={proofDescription}
									onChange={(e) => setProofDescription(e.target.value)}
									placeholder="Información adicional que ayude a verificar tu identidad..."
									rows={3}
									className="resize-none"
								/>
							</div>

							{error && (
								<p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
									{error}
								</p>
							)}
						</DialogBody>

						<DialogFooter>
							<Button
								type="button"
								variant="ghost"
								onClick={handleClose}
								disabled={loading}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={loading} className="min-w-32">
								{loading ? (
									<>
										<Loader2Icon className="size-4 animate-spin" />
										Enviando...
									</>
								) : (
									"Enviar solicitud"
								)}
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
