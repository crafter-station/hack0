"use client";

import { Building2, Info, User, UserCheck } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { initiateHostClaim, type ClaimType } from "@/lib/actions/host-claims";

interface ClaimHostButtonProps {
	lumaHostApiId: string;
	hostName: string;
	hostAvatarUrl?: string | null;
	userHasPersonalOrg?: boolean;
}

function ClaimContent({
	hostName,
	hostAvatarUrl,
	claimType,
	onClaimTypeChange,
	userHasPersonalOrg,
}: {
	hostName: string;
	hostAvatarUrl?: string | null;
	claimType: ClaimType;
	onClaimTypeChange: (type: ClaimType) => void;
	userHasPersonalOrg?: boolean;
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

			<div className="space-y-3">
				<Label className="text-sm font-medium">¿Cómo quieres reclamar este perfil?</Label>
				<RadioGroup
					value={claimType}
					onValueChange={(v) => onClaimTypeChange(v as ClaimType)}
					className="space-y-2"
				>
					<label
						htmlFor="personal"
						className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
							claimType === "personal"
								? "border-primary bg-primary/5"
								: "hover:bg-muted/50"
						} ${userHasPersonalOrg ? "opacity-50 cursor-not-allowed" : ""}`}
					>
						<RadioGroupItem
							value="personal"
							id="personal"
							disabled={userHasPersonalOrg}
							className="mt-0.5"
						/>
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<User className="h-4 w-4" />
								<span className="font-medium text-sm">Perfil personal</span>
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								{userHasPersonalOrg
									? "Ya tienes un perfil personal"
									: "Es mi identidad personal (solo puedes tener uno)"}
							</p>
						</div>
					</label>

					<label
						htmlFor="community"
						className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
							claimType === "community"
								? "border-primary bg-primary/5"
								: "hover:bg-muted/50"
						}`}
					>
						<RadioGroupItem value="community" id="community" className="mt-0.5" />
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<Building2 className="h-4 w-4" />
								<span className="font-medium text-sm">Comunidad</span>
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Es una comunidad/organización que administro (sin límite)
							</p>
						</div>
					</label>
				</RadioGroup>
			</div>

			<Alert>
				<Info className="h-4 w-4" />
				<AlertDescription className="text-sm">
					{claimType === "personal" ? (
						<ul className="space-y-1 list-disc list-inside text-muted-foreground">
							<li>Se creará tu perfil personal en Hack0</li>
							<li>Los eventos de este host se vincularán a ti</li>
							<li>Aparecerás como organizador verificado</li>
						</ul>
					) : (
						<ul className="space-y-1 list-disc list-inside text-muted-foreground">
							<li>Se creará una comunidad con este nombre</li>
							<li>Serás el administrador de la comunidad</li>
							<li>Los eventos de este host se vincularán a la comunidad</li>
						</ul>
					)}
				</AlertDescription>
			</Alert>
		</div>
	);
}

export function ClaimHostButton({
	lumaHostApiId,
	hostName,
	hostAvatarUrl,
	userHasPersonalOrg,
}: ClaimHostButtonProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [claimType, setClaimType] = useState<ClaimType>(
		userHasPersonalOrg ? "community" : "personal"
	);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const handleClaim = () => {
		startTransition(async () => {
			const result = await initiateHostClaim(lumaHostApiId, claimType);
			if (result.success) {
				toast.success(result.message || "Email de verificación enviado", {
					description: "Revisa tu correo para confirmar",
				});
				setOpen(false);
			} else {
				toast.error(result.error);
			}
		});
	};

	const TriggerButton = (
		<Button variant="outline" size="sm" className="gap-1.5 text-xs">
			<UserCheck className="h-3.5 w-3.5" />
			Reclamar
		</Button>
	);

	const buttonLabel = claimType === "personal"
		? "Reclamar como personal"
		: "Reclamar como comunidad";

	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					{TriggerButton}
				</DialogTrigger>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Reclamar {hostName}</DialogTitle>
						<DialogDescription>
							Vincula este perfil de Luma con tu cuenta de Hack0
						</DialogDescription>
					</DialogHeader>

					<ClaimContent
						hostName={hostName}
						hostAvatarUrl={hostAvatarUrl}
						claimType={claimType}
						onClaimTypeChange={setClaimType}
						userHasPersonalOrg={userHasPersonalOrg}
					/>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" onClick={() => setOpen(false)}>
							Cancelar
						</Button>
						<Button onClick={handleClaim} disabled={isPending}>
							{isPending ? "Enviando..." : buttonLabel}
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
					<DrawerTitle>Reclamar {hostName}</DrawerTitle>
					<DrawerDescription>
						Vincula este perfil de Luma con tu cuenta de Hack0
					</DrawerDescription>
				</DrawerHeader>

				<div className="px-4">
					<ClaimContent
						hostName={hostName}
						hostAvatarUrl={hostAvatarUrl}
						claimType={claimType}
						onClaimTypeChange={setClaimType}
						userHasPersonalOrg={userHasPersonalOrg}
					/>
				</div>

				<DrawerFooter className="flex-col gap-2">
					<Button onClick={handleClaim} disabled={isPending} className="w-full">
						{isPending ? "Enviando..." : buttonLabel}
					</Button>
					<DrawerClose asChild>
						<Button variant="outline" className="w-full">
							Cancelar
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
