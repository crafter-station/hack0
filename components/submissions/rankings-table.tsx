"use client";

import { Loader2, Trophy } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { calculateRankings } from "@/lib/actions/submissions";
import type { Submission } from "@/lib/db/schema";

const MEDAL: Record<number, string> = {
	1: "\u{1F947}",
	2: "\u{1F948}",
	3: "\u{1F949}",
};

const STATUS_LABELS: Record<string, string> = {
	draft: "Borrador",
	submitted: "Enviado",
	under_review: "En revision",
	scored: "Calificado",
	winner: "Ganador",
	finalist: "Finalista",
	rejected: "Rechazado",
	disqualified: "Descalificado",
};

interface RankingsTableProps {
	submissions: Submission[];
	eventId?: string;
	isOrganizer?: boolean;
}

export function RankingsTable({
	submissions,
	eventId,
	isOrganizer,
}: RankingsTableProps) {
	const [isPending, startTransition] = useTransition();

	const sorted = [...submissions].sort((a, b) => {
		if (a.rank != null && b.rank != null) return a.rank - b.rank;
		if (a.rank != null) return -1;
		if (b.rank != null) return 1;
		return (b.averageScore ?? 0) - (a.averageScore ?? 0);
	});

	function handleCalculate() {
		if (!eventId) return;
		startTransition(async () => {
			const result = await calculateRankings(eventId);
			if (result.success) {
				toast.success("Rankings calculados exitosamente");
			} else {
				toast.error(result.error ?? "Error al calcular rankings");
			}
		});
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Trophy className="h-4 w-4 text-amber-500" />
					<h3 className="text-sm font-medium">Rankings</h3>
				</div>

				{isOrganizer && eventId && (
					<Button
						variant="outline"
						size="sm"
						onClick={handleCalculate}
						disabled={isPending}
					>
						{isPending && (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						)}
						Calcular Rankings
					</Button>
				)}
			</div>

			{sorted.length === 0 ? (
				<div className="rounded-lg border border-dashed p-8 text-center">
					<p className="text-sm text-muted-foreground">
						No hay proyectos calificados aun
					</p>
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-16">#</TableHead>
							<TableHead>Proyecto</TableHead>
							<TableHead className="text-right">Puntaje</TableHead>
							<TableHead className="text-right">Jueces</TableHead>
							<TableHead>Estado</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sorted.map((submission) => {
							const rank = submission.rank;
							const medal = rank != null ? MEDAL[rank] : undefined;
							const isHighlight =
								submission.status === "winner" ||
								submission.status === "finalist";

							return (
								<TableRow
									key={submission.id}
									className={
										isHighlight
											? "bg-amber-500/5 hover:bg-amber-500/10"
											: undefined
									}
								>
									<TableCell className="font-medium">
										{medal ? (
											<span className="text-base">{medal}</span>
										) : (
											<span className="text-muted-foreground">
												{rank ?? "-"}
											</span>
										)}
									</TableCell>
									<TableCell>
										<span className="font-medium">
											{submission.projectName}
										</span>
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{submission.averageScore != null
											? submission.averageScore
											: "-"}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{submission.judgeCount ?? 0}
									</TableCell>
									<TableCell>
										<Badge
											variant={
												submission.status === "winner"
													? "default"
													: submission.status === "finalist"
														? "secondary"
														: "outline"
											}
										>
											{STATUS_LABELS[submission.status ?? "draft"]}
										</Badge>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
