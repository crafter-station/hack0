"use client";

import { Check, CheckCircle2, Loader2 } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	claimAttendance,
	removeAttendanceClaim,
} from "@/lib/actions/attendance";
import { cn } from "@/lib/utils";

interface AttendanceButtonProps {
	eventId: string;
	eventEndDate: Date | null;
	initialClaimed: boolean;
	initialVerification: "self_reported" | "organizer_verified" | null;
	className?: string;
}

export function AttendanceButton({
	eventId,
	eventEndDate,
	initialClaimed,
	initialVerification,
	className,
}: AttendanceButtonProps) {
	const [isPending, startTransition] = useTransition();
	const [optimisticState, setOptimisticState] = useOptimistic(
		{ claimed: initialClaimed, verification: initialVerification },
		(
			_,
			newState: {
				claimed: boolean;
				verification: "self_reported" | "organizer_verified" | null;
			},
		) => newState,
	);

	const hasEnded = eventEndDate && eventEndDate < new Date();

	if (!hasEnded) {
		return null;
	}

	const handleClick = () => {
		startTransition(async () => {
			if (optimisticState.claimed) {
				setOptimisticState({ claimed: false, verification: null });
				const result = await removeAttendanceClaim(eventId);
				if (!result.success) {
					setOptimisticState({
						claimed: true,
						verification: optimisticState.verification,
					});
					toast.error(result.error);
				} else {
					toast.success("Asistencia removida");
				}
			} else {
				setOptimisticState({ claimed: true, verification: "self_reported" });
				const result = await claimAttendance(eventId);
				if (!result.success) {
					setOptimisticState({ claimed: false, verification: null });
					toast.error(result.error);
				} else {
					toast.success("¡Asistencia registrada!");
				}
			}
		});
	};

	const isVerified = optimisticState.verification === "organizer_verified";

	if (isVerified) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							disabled
							className={cn(
								"gap-1.5 text-xs border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
								className,
							)}
						>
							<CheckCircle2 className="h-3.5 w-3.5" />
							Asistencia verificada
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>El organizador verificó tu asistencia</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	if (optimisticState.claimed) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							onClick={handleClick}
							disabled={isPending}
							className={cn(
								"gap-1.5 text-xs border-muted-foreground/30 text-muted-foreground",
								className,
							)}
						>
							{isPending ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Check className="h-3.5 w-3.5" />
							)}
							Asistí
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Click para desmarcar asistencia</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={handleClick}
			disabled={isPending}
			className={cn("gap-1.5 text-xs", className)}
		>
			{isPending ? (
				<Loader2 className="h-3.5 w-3.5 animate-spin" />
			) : (
				<Check className="h-3.5 w-3.5" />
			)}
			Marcar asistencia
		</Button>
	);
}
