"use client";

import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	assignJudge,
	getEventSubmissions,
	getJudgeAssignments,
	removeJudge,
} from "@/lib/actions/submissions";
import type {
	Event,
	JudgeAssignment,
	JudgingCriterion,
	Submission,
	SubmissionTemplate,
} from "@/lib/db/schema";
import { RankingsTable } from "./rankings-table";

interface ManageJudgingTabProps {
	event: Event;
	template: SubmissionTemplate | null;
}

export function ManageJudgingTab({ event, template }: ManageJudgingTabProps) {
	const [judges, setJudges] = useState<JudgeAssignment[]>([]);
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [newJudgeId, setNewJudgeId] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isAddingJudge, startAddingJudge] = useTransition();
	const [removingJudgeId, setRemovingJudgeId] = useState<string | null>(null);

	const criteria = (template?.judgingCriteria ?? []) as JudgingCriterion[];

	const loadData = useCallback(async () => {
		setIsLoading(true);
		const [judgeData, subData] = await Promise.all([
			getJudgeAssignments(event.id),
			getEventSubmissions(event.id),
		]);
		setJudges(judgeData);
		setSubmissions(subData);
		setIsLoading(false);
	}, [event.id]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	function handleAddJudge() {
		if (!newJudgeId.trim()) {
			toast.error("Ingresa el ID del juez");
			return;
		}

		startAddingJudge(async () => {
			const result = await assignJudge(event.id, newJudgeId.trim());
			if (result.success) {
				toast.success("Juez asignado");
				setNewJudgeId("");
				loadData();
			} else {
				toast.error(result.error ?? "Error al asignar juez");
			}
		});
	}

	async function handleRemoveJudge(judgeUserId: string) {
		setRemovingJudgeId(judgeUserId);
		const result = await removeJudge(event.id, judgeUserId);
		if (result.success) {
			setJudges((prev) => prev.filter((j) => j.userId !== judgeUserId));
			toast.success("Juez removido");
		} else {
			toast.error(result.error ?? "Error al remover juez");
		}
		setRemovingJudgeId(null);
	}

	if (!template) {
		return (
			<div className="rounded-lg border border-dashed p-8 text-center">
				<Users className="mx-auto h-8 w-8 text-muted-foreground" />
				<h3 className="mt-3 text-sm font-medium">
					Configura las entregas primero
				</h3>
				<p className="mt-1 text-xs text-muted-foreground">
					Necesitas crear un template con criterios de evaluacion antes de
					gestionar jueces
				</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Judge assignment */}
			<section className="space-y-4">
				<h3 className="text-sm font-medium">Jueces ({judges.length})</h3>

				<div className="flex gap-2">
					<Input
						placeholder="ID del usuario juez..."
						value={newJudgeId}
						onChange={(e) => setNewJudgeId(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleAddJudge();
						}}
						disabled={isAddingJudge}
					/>
					<Button
						onClick={handleAddJudge}
						disabled={isAddingJudge || !newJudgeId.trim()}
						size="default"
					>
						{isAddingJudge ? (
							<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
						) : (
							<Plus className="mr-1.5 h-4 w-4" />
						)}
						Agregar
					</Button>
				</div>

				{judges.length === 0 ? (
					<div className="rounded-lg border border-dashed p-6 text-center">
						<p className="text-sm text-muted-foreground">
							No hay jueces asignados
						</p>
					</div>
				) : (
					<div className="divide-y rounded-lg border">
						{judges.map((judge) => (
							<div
								key={judge.id}
								className="flex items-center justify-between px-4 py-3"
							>
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
										{judge.userId.slice(0, 2).toUpperCase()}
									</div>
									<div>
										<span className="text-sm font-medium">{judge.userId}</span>
										<p className="text-xs text-muted-foreground">
											Asignado{" "}
											{judge.createdAt
												? new Date(judge.createdAt).toLocaleDateString(
														"es-PE",
														{
															day: "numeric",
															month: "short",
														},
													)
												: ""}
										</p>
									</div>
								</div>

								<Button
									variant="ghost"
									size="sm"
									className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
									onClick={() => handleRemoveJudge(judge.userId)}
									disabled={removingJudgeId === judge.userId}
								>
									{removingJudgeId === judge.userId ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
									) : (
										<Trash2 className="h-3.5 w-3.5" />
									)}
								</Button>
							</div>
						))}
					</div>
				)}
			</section>

			{/* Judging criteria */}
			{criteria.length > 0 && (
				<section className="space-y-4">
					<h3 className="text-sm font-medium">
						Criterios de evaluacion ({criteria.length})
					</h3>

					<div className="grid gap-2">
						{[...criteria]
							.sort((a, b) => a.order - b.order)
							.map((criterion) => (
								<Card key={criterion.id} className="p-3">
									<div className="flex items-center justify-between">
										<div>
											<span className="text-sm font-medium">
												{criterion.name}
											</span>
											{criterion.description && (
												<p className="text-xs text-muted-foreground mt-0.5">
													{criterion.description}
												</p>
											)}
										</div>
										<div className="flex items-center gap-2">
											<Badge variant="outline" className="text-xs">
												0-{criterion.maxScore} pts
											</Badge>
											<Badge variant="secondary" className="text-xs">
												Peso: {criterion.weight}
											</Badge>
										</div>
									</div>
								</Card>
							))}
					</div>
				</section>
			)}

			{/* Rankings */}
			<section>
				<RankingsTable
					submissions={submissions}
					eventId={event.id}
					isOrganizer
				/>
			</section>
		</div>
	);
}
