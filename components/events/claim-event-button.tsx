"use client";

import { Building2, Flag } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { claimEvent, getUserCommunities } from "@/lib/actions/host-claims";

interface ClaimEventButtonProps {
	eventId: string;
	eventName: string;
}

interface Community {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
}

function ClaimContent({
	communities,
	selectedOrgId,
	onSelectedOrgChange,
	isLoading,
}: {
	communities: Community[];
	selectedOrgId: string | null;
	onSelectedOrgChange: (orgId: string) => void;
	isLoading: boolean;
}) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
			</div>
		);
	}

	if (communities.length === 0) {
		return (
			<div className="text-center py-6 space-y-2">
				<Building2 className="h-10 w-10 mx-auto text-muted-foreground" />
				<p className="text-sm text-muted-foreground">
					No tienes comunidades. Crea una primero para poder reclamar eventos.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Selecciona la comunidad a la que quieres vincular este evento:
			</p>
			<Select value={selectedOrgId || ""} onValueChange={onSelectedOrgChange}>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Selecciona una comunidad" />
				</SelectTrigger>
				<SelectContent>
					{communities.map((community) => (
						<SelectItem key={community.id} value={community.id}>
							<div className="flex items-center gap-2">
								<Avatar className="h-5 w-5">
									<AvatarImage src={community.logoUrl || undefined} />
									<AvatarFallback className="text-xs">
										{community.name.charAt(0)}
									</AvatarFallback>
								</Avatar>
								{community.name}
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

export function ClaimEventButton({ eventId, eventName }: ClaimEventButtonProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [communities, setCommunities] = useState<Community[]>([]);
	const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	useEffect(() => {
		if (open) {
			setIsLoading(true);
			getUserCommunities()
				.then(setCommunities)
				.finally(() => setIsLoading(false));
		}
	}, [open]);

	const handleClaim = () => {
		if (!selectedOrgId) {
			toast.error("Selecciona una comunidad");
			return;
		}

		startTransition(async () => {
			const result = await claimEvent(eventId, selectedOrgId);
			if (result.success) {
				toast.success(result.message);
				setOpen(false);
			} else {
				toast.error(result.error);
			}
		});
	};

	const TriggerButton = (
		<Button variant="outline" size="sm" className="gap-1.5 text-xs">
			<Flag className="h-3.5 w-3.5" />
			Reclamar evento
		</Button>
	);

	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>{TriggerButton}</DialogTrigger>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Reclamar evento</DialogTitle>
						<DialogDescription>
							Vincula &quot;{eventName}&quot; con una de tus comunidades
						</DialogDescription>
					</DialogHeader>

					<ClaimContent
						communities={communities}
						selectedOrgId={selectedOrgId}
						onSelectedOrgChange={setSelectedOrgId}
						isLoading={isLoading}
					/>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" onClick={() => setOpen(false)}>
							Cancelar
						</Button>
						<Button
							onClick={handleClaim}
							disabled={isPending || !selectedOrgId || communities.length === 0}
						>
							{isPending ? "Vinculando..." : "Vincular evento"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Reclamar evento</DrawerTitle>
					<DrawerDescription>
						Vincula &quot;{eventName}&quot; con una de tus comunidades
					</DrawerDescription>
				</DrawerHeader>

				<div className="px-4">
					<ClaimContent
						communities={communities}
						selectedOrgId={selectedOrgId}
						onSelectedOrgChange={setSelectedOrgId}
						isLoading={isLoading}
					/>
				</div>

				<DrawerFooter className="flex-col gap-2">
					<Button
						onClick={handleClaim}
						disabled={isPending || !selectedOrgId || communities.length === 0}
						className="w-full"
					>
						{isPending ? "Vinculando..." : "Vincular evento"}
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
