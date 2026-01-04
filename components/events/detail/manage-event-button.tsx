"use client";

import { ArrowUpRight, Settings } from "lucide-react";
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
		<Link
			href={`/e/${event.shortCode}/manage`}
			target="_blank"
			rel="noopener noreferrer"
		>
			<button className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-background/90 backdrop-blur-sm px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
				<Settings className="h-3.5 w-3.5" />
				<span className="hidden sm:inline">Gestionar evento</span>
				<span className="sm:hidden">Gestionar</span>
			</button>
		</Link>
	);
}

export function ManageEventCard({ event }: ManageEventButtonProps) {
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
		<div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
			<div className="flex items-center justify-between gap-3">
				<p className="text-sm text-amber-900 dark:text-amber-200/90">
					Tienes acceso de gestión a este evento
				</p>
				<Link
					href={`/e/${event.shortCode}/manage`}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1.5 shrink-0 rounded-md bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors"
				>
					Gestionar
					<ArrowUpRight className="h-3.5 w-3.5" />
				</Link>
			</div>
		</div>
	);
}
