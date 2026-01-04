"use client";

import { Pencil, Share2, Users } from "lucide-react";
import Link from "next/link";
import { EditEventDialog } from "@/components/events/edit/edit-event-dialog";
import { ShareEventDialog } from "@/components/manage/share-event-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Event } from "@/lib/db/schema";

interface QuickActionsProps {
	event: Event;
	eventCode: string;
}

export function QuickActions({ event, eventCode }: QuickActionsProps) {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="flex flex-wrap gap-3">
					<EditEventDialog event={event}>
						<Button
							variant="outline"
							className="flex-1 min-w-[140px] gap-2 h-11"
						>
							<div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10">
								<Pencil className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
							</div>
							<span>Editar evento</span>
						</Button>
					</EditEventDialog>

					<ShareEventDialog event={event}>
						<Button
							variant="outline"
							className="flex-1 min-w-[140px] gap-2 h-11"
						>
							<div className="flex h-7 w-7 items-center justify-center rounded-md bg-pink-500/10">
								<Share2 className="h-4 w-4 text-pink-600 dark:text-pink-400" />
							</div>
							<span>Compartir</span>
						</Button>
					</ShareEventDialog>

					<Link
						href={`/e/${eventCode}/manage?tab=team`}
						className="flex-1 min-w-[140px]"
					>
						<Button variant="outline" className="w-full gap-2 h-11">
							<div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10">
								<Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
							</div>
							<span>Invitar equipo</span>
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
