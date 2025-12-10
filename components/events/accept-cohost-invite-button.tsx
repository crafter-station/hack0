"use client";

import { Check, Loader2, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

interface AcceptCohostInviteButtonProps {
	type: "accept" | "reject";
	label?: string;
	loadingLabel?: string;
}

export function AcceptCohostInviteButton({
	type,
	label,
	loadingLabel,
}: AcceptCohostInviteButtonProps) {
	const { pending } = useFormStatus();

	const defaultLabel = type === "accept" ? "Aceptar invitación" : "Rechazar";
	const defaultLoadingLabel =
		type === "accept" ? "Aceptando..." : "Rechazando...";

	return (
		<Button
			type="submit"
			className="gap-2"
			variant={type === "reject" ? "outline" : "default"}
			disabled={pending}
		>
			{pending ? (
				<>
					<Loader2 className="h-4 w-4 animate-spin" />
					{loadingLabel || defaultLoadingLabel}
				</>
			) : (
				<>
					{type === "accept" ? (
						<Check className="h-4 w-4" />
					) : (
						<X className="h-4 w-4" />
					)}
					{label || defaultLabel}
				</>
			)}
		</Button>
	);
}
