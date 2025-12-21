"use client";

import { AlertTriangle, CheckCircle2, Info, UserCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { initiateHostClaim } from "@/lib/actions/host-claims";

interface ClaimHostButtonProps {
	lumaHostApiId: string;
	hostName: string;
	hostAvatarUrl?: string | null;
	userHasClaimedHost?: boolean;
}

function ClaimContent({
	hostName,
	hostAvatarUrl,
	isPending,
	onClaim,
}: {
	hostName: string;
	hostAvatarUrl?: string | null;
	isPending: boolean;
	onClaim: () => void;
}) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
				<Avatar className="h-12 w-12">
					<AvatarImage src={hostAvatarUrl || undefined} />
					<AvatarFallback>{hostName.charAt(0)}</AvatarFallback>
				</Avatar>
				<div>
					<p className="font-medium">{hostName}</p>
					<p className="text-sm text-muted-foreground">Host en Luma</p>
				</div>
			</div>

			<Alert>
				<Info className="h-4 w-4" />
				<AlertDescription className="text-sm">
					<strong>¿Qué sucederá?</strong>
					<ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
						<li>Se creará tu perfil personal en Hack0</li>
						<li>Todos los eventos donde eres host se vincularán a ti</li>
						<li>Podrás gestionar y editar tus eventos</li>
						<li>Aparecerás como organizador verificado</li>
					</ul>
				</AlertDescription>
			</Alert>

			<Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 [&>svg]:text-amber-600">
				<AlertTriangle className="h-4 w-4" />
				<AlertDescription className="text-sm">
					<span className="font-semibold">Importante:</span> Solo puedes reclamar un único perfil de host. Esta acción es permanente y no se puede deshacer.
				</AlertDescription>
			</Alert>

			<Button onClick={onClaim} disabled={isPending} className="w-full">
				{isPending ? "Enviando..." : "Sí, soy yo — Verificar"}
			</Button>
		</div>
	);
}

function AlreadyClaimedContent() {
	return (
		<div className="py-4">
			<Alert className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 [&>svg]:text-amber-600">
				<AlertTriangle className="h-4 w-4" />
				<AlertDescription className="text-sm">
					Ya tienes un perfil de host vinculado a tu cuenta. Solo puedes reclamar un único perfil.
				</AlertDescription>
			</Alert>
		</div>
	);
}

export function ClaimHostButton({
	lumaHostApiId,
	hostName,
	hostAvatarUrl,
	userHasClaimedHost,
}: ClaimHostButtonProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const handleClaim = () => {
		startTransition(async () => {
			const result = await initiateHostClaim(lumaHostApiId);
			if (result.success) {
				toast.success(result.message || "Email de verificación enviado", {
					description: result.requiresReview
						? "Un administrador revisará tu solicitud"
						: "Revisa tu correo para confirmar",
				});
				setOpen(false);
			} else {
				toast.error(result.error);
			}
		});
	};

	const TriggerButton = userHasClaimedHost ? (
		<Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground opacity-50 cursor-not-allowed">
			<CheckCircle2 className="h-3.5 w-3.5" />
			Ya tienes perfil
		</Button>
	) : (
		<Button variant="outline" size="sm" className="gap-1.5 text-xs">
			<UserCheck className="h-3.5 w-3.5" />
			Reclamar
		</Button>
	);

	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					{TriggerButton}
				</DialogTrigger>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{userHasClaimedHost ? "Ya tienes un perfil vinculado" : `¿Eres ${hostName}?`}
						</DialogTitle>
						<DialogDescription>
							{userHasClaimedHost
								? "Solo puedes vincular un perfil de host a tu cuenta"
								: "Vincula tu perfil de Luma con tu cuenta de Hack0"
							}
						</DialogDescription>
					</DialogHeader>

					{userHasClaimedHost ? (
						<AlreadyClaimedContent />
					) : (
						<ClaimContent
							hostName={hostName}
							hostAvatarUrl={hostAvatarUrl}
							isPending={isPending}
							onClaim={handleClaim}
						/>
					)}

					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)}>
							{userHasClaimedHost ? "Entendido" : "Cancelar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>
				{TriggerButton}
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>
						{userHasClaimedHost ? "Ya tienes un perfil vinculado" : `¿Eres ${hostName}?`}
					</DrawerTitle>
					<DrawerDescription>
						{userHasClaimedHost
							? "Solo puedes vincular un perfil de host a tu cuenta"
							: "Vincula tu perfil de Luma con tu cuenta de Hack0"
						}
					</DrawerDescription>
				</DrawerHeader>

				<div className="px-4">
					{userHasClaimedHost ? (
						<AlreadyClaimedContent />
					) : (
						<ClaimContent
							hostName={hostName}
							hostAvatarUrl={hostAvatarUrl}
							isPending={isPending}
							onClaim={handleClaim}
						/>
					)}
				</div>

				<DrawerFooter>
					<DrawerClose asChild>
						<Button variant="outline">
							{userHasClaimedHost ? "Entendido" : "Cancelar"}
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
