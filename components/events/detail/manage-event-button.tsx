"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { canManageEventById } from "@/lib/actions/permissions";
import type { Event } from "@/lib/db/schema";

interface ManageEventButtonProps {
	event: Event;
	communitySlug?: string | null;
}

export function ManageEventButton({ event }: ManageEventButtonProps) {
	const [canManage, setCanManage] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		canManageEventById(event.id).then((result) => {
			setCanManage(result);
			setLoading(false);
		});
	}, [event.id]);

	if (loading || !canManage || !event.shortCode) {
		return null;
	}

	return (
		<Link href={`/e/${event.shortCode}/manage`}>
			<button className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-background/90 backdrop-blur-sm px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
				<Settings className="h-3.5 w-3.5" />
				<span className="hidden sm:inline">Gestionar evento</span>
				<span className="sm:hidden">Gestionar</span>
			</button>
		</Link>
	);
}
