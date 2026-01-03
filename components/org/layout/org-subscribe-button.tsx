"use client";

import { useUser } from "@clerk/nextjs";
import { Bell, BellOff, Check, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

type SubscriptionStatus =
	| "checking"
	| "idle"
	| "loading"
	| "subscribed"
	| "pending"
	| "error";

interface OrgSubscribeButtonProps {
	communityId: string;
	communitySlug: string;
}

export function OrgSubscribeButton({
	communityId,
	communitySlug,
}: OrgSubscribeButtonProps) {
	const { isSignedIn, user } = useUser();
	const router = useRouter();
	const [status, setStatus] = useState<SubscriptionStatus>("checking");

	useEffect(() => {
		if (!isSignedIn || !user?.primaryEmailAddress?.emailAddress) {
			setStatus("idle");
			return;
		}

		const checkStatus = async () => {
			try {
				const email = user.primaryEmailAddress?.emailAddress;
				const res = await fetch(
					`/api/subscribe/status?email=${encodeURIComponent(email!)}&communityId=${communityId}`,
				);
				const data = await res.json();

				if (data.exists && data.isVerified && data.isActive) {
					setStatus("subscribed");
				} else if (data.exists && !data.isVerified) {
					setStatus("pending");
				} else {
					setStatus("idle");
				}
			} catch {
				setStatus("idle");
			}
		};

		checkStatus();
	}, [isSignedIn, user, communityId]);

	const handleSubscribe = async () => {
		if (!isSignedIn) {
			router.push(
				`/sign-in?redirect_url=${encodeURIComponent(`/c/${communitySlug}`)}`,
			);
			return;
		}

		const email = user?.primaryEmailAddress?.emailAddress;
		if (!email) {
			toast.error("No se encontró un email asociado a tu cuenta");
			return;
		}

		setStatus("loading");

		try {
			const res = await fetch("/api/subscribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, communityId }),
			});

			const data = await res.json();

			if (res.ok) {
				if (data.alreadySubscribed) {
					setStatus("subscribed");
					toast.success("Ya tienes notificaciones activadas");
				} else {
					setStatus("pending");
					toast.success("Revisa tu email para confirmar la suscripcion");
				}
			} else {
				setStatus("error");
				toast.error(data.error || "Error al suscribirse");
			}
		} catch {
			setStatus("error");
			toast.error("Error al procesar la suscripcion");
		}
	};

	if (status === "checking") {
		return (
			<Button
				variant="outline"
				size="sm"
				className="h-7 text-xs gap-1.5"
				disabled
			>
				<Loader2 className="h-3.5 w-3.5 animate-spin" />
			</Button>
		);
	}

	if (status === "subscribed") {
		return (
			<TooltipProvider delayDuration={100}>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs gap-1.5 text-emerald-600 border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
						>
							<Check className="h-3.5 w-3.5" />
							<Bell className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p className="text-xs">Notificaciones activadas</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	if (status === "pending") {
		return (
			<TooltipProvider delayDuration={100}>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs gap-1.5 text-amber-600 border-amber-600/30 hover:bg-amber-50 dark:hover:bg-amber-950/20"
						>
							<Mail className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p className="text-xs">Confirma tu email para activar</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return (
		<TooltipProvider delayDuration={100}>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="h-7 text-xs gap-1.5"
						onClick={handleSubscribe}
						disabled={status === "loading"}
					>
						{status === "loading" ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<BellOff className="h-3.5 w-3.5" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p className="text-xs">Recibir notificaciones de eventos</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
