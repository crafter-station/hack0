"use client";

import { Check, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

interface AcceptInviteButtonProps {
	label?: string;
	loadingLabel?: string;
}

export function AcceptInviteButton({
	label = "Unirme a la comunidad",
	loadingLabel = "Uniéndote...",
}: AcceptInviteButtonProps) {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" className="w-full gap-2" disabled={pending}>
			{pending ? (
				<>
					<Loader2 className="h-4 w-4 animate-spin" />
					{loadingLabel}
				</>
			) : (
				<>
					<Check className="h-4 w-4" />
					{label}
				</>
			)}
		</Button>
	);
}
