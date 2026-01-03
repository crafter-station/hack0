"use client";

import { Shield, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
	requestAdminUpgrade,
	requestMemberUpgrade,
} from "@/lib/actions/communities";

interface JoinOrgDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	communityId: string;
	communityName: string;
	action: "request-member" | "request-admin";
}

export function JoinOrgDialog({
	open,
	onOpenChange,
	communityId,
	communityName,
	action,
}: JoinOrgDialogProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const handleAction = async () => {
		setIsLoading(true);
		try {
			const result =
				action === "request-member"
					? await requestMemberUpgrade(communityId)
					: await requestAdminUpgrade(communityId);

			if (result.success) {
				toast.success(result.message || "Acción completada exitosamente");
				onOpenChange(false);
				router.refresh();
			} else {
				toast.error(result.error || "Ocurrió un error");
			}
		} catch (_error) {
			toast.error("Ocurrió un error inesperado");
		} finally {
			setIsLoading(false);
		}
	};

	const content = (
		<div className="space-y-4">
			<div className="rounded-lg border bg-muted/30 p-4 space-y-3">
				{action === "request-member" && (
					<>
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
								<Users className="h-5 w-5 text-emerald-500" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-medium">Convertirte en miembro</p>
								<p className="text-sm text-muted-foreground truncate">
									{communityName}
								</p>
							</div>
						</div>
						<p className="text-sm text-muted-foreground">
							Como <span className="font-medium">miembro</span>, además podrás:
						</p>
						<ul className="text-sm text-muted-foreground space-y-1.5 ml-4">
							<li>• Acceder a eventos privados de la comunidad</li>
							<li>• Participar en discusiones internas</li>
							<li>• Colaborar en proyectos de la comunidad</li>
						</ul>
						<p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
							Se activa automáticamente al confirmar
						</p>
					</>
				)}

				{action === "request-admin" && (
					<>
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
								<Shield className="h-5 w-5 text-amber-500" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-medium">Solicitar ser admin</p>
								<p className="text-sm text-muted-foreground truncate">
									{communityName}
								</p>
							</div>
						</div>
						<p className="text-sm text-muted-foreground">
							Como <span className="font-medium">admin</span>, además podrás:
						</p>
						<ul className="text-sm text-muted-foreground space-y-1.5 ml-4">
							<li>• Crear y gestionar eventos</li>
							<li>• Invitar nuevos miembros</li>
							<li>• Moderar la comunidad</li>
						</ul>
						<p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
							El owner de la comunidad revisará tu solicitud
						</p>
					</>
				)}
			</div>

			<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
				<Button
					variant="outline"
					onClick={() => onOpenChange(false)}
					disabled={isLoading}
				>
					Cancelar
				</Button>
				<Button onClick={handleAction} disabled={isLoading}>
					{isLoading
						? "Procesando..."
						: action === "request-member"
							? "Confirmar"
							: "Enviar solicitud"}
				</Button>
			</div>
		</div>
	);

	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>
							{action === "request-member"
								? "Convertirte en miembro"
								: "Solicitar rol de admin"}
						</DialogTitle>
						<DialogDescription>
							{action === "request-member"
								? "Accede a beneficios exclusivos de la comunidad"
								: "El owner revisará tu solicitud"}
						</DialogDescription>
					</DialogHeader>
					{content}
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>
						{action === "request-member"
							? "Convertirte en miembro"
							: "Solicitar rol de admin"}
					</DrawerTitle>
					<DrawerDescription>
						{action === "request-member"
							? "Accede a beneficios exclusivos de la comunidad"
							: "El owner revisará tu solicitud"}
					</DrawerDescription>
				</DrawerHeader>
				<div className="px-4 pb-4">{content}</div>
			</DrawerContent>
		</Drawer>
	);
}
