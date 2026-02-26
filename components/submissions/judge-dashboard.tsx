"use client";

import { CheckCircle2, Circle, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMyJudgeScores } from "@/lib/actions/submissions";
import type {
	JudgeScore,
	JudgingCriterion,
	Submission,
	SubmissionTeamMember,
} from "@/lib/db/schema";
import { JudgeScoreCard } from "./judge-score-card";

type SubmissionWithTeam = Submission & {
	teamMembers: SubmissionTeamMember[];
};

type FilterOption = "all" | "scored" | "not_scored";

interface JudgeDashboardProps {
	eventId: string;
	submissions: SubmissionWithTeam[];
	criteria: JudgingCriterion[];
}

export function JudgeDashboard({
	eventId,
	submissions,
	criteria,
}: JudgeDashboardProps) {
	const [filter, setFilter] = useState<FilterOption>("all");
	const [scoredMap, setScoredMap] = useState<Map<string, JudgeScore[]>>(
		new Map(),
	);
	const [activeSubmission, setActiveSubmission] =
		useState<SubmissionWithTeam | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const loadScores = useCallback(async () => {
		setIsLoading(true);
		const map = new Map<string, JudgeScore[]>();
		for (const sub of submissions) {
			const scores = await getMyJudgeScores(sub.id);
			if (scores.length > 0) {
				map.set(sub.id, scores);
			}
		}
		setScoredMap(map);
		setIsLoading(false);
	}, [submissions]);

	useEffect(() => {
		loadScores();
	}, [loadScores]);

	const isScored = (submissionId: string) => scoredMap.has(submissionId);

	const filtered = submissions.filter((sub) => {
		if (filter === "scored") return isScored(sub.id);
		if (filter === "not_scored") return !isScored(sub.id);
		return true;
	});

	const scoredCount = submissions.filter((s) => isScored(s.id)).length;

	const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
		{ value: "all", label: `Todos (${submissions.length})` },
		{
			value: "not_scored",
			label: `Sin calificar (${submissions.length - scoredCount})`,
		},
		{ value: "scored", label: `Calificados (${scoredCount})` },
	];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Panel de Juez</h2>
					<p className="text-sm text-muted-foreground">
						{scoredCount} de {submissions.length} proyectos calificados
					</p>
				</div>
			</div>

			<div className="flex gap-2">
				{FILTER_OPTIONS.map((opt) => (
					<Button
						key={opt.value}
						variant={filter === opt.value ? "default" : "outline"}
						size="sm"
						onClick={() => setFilter(opt.value)}
					>
						{opt.label}
					</Button>
				))}
			</div>

			{isLoading ? (
				<div className="grid gap-3">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-20 animate-pulse rounded-lg border bg-muted/30"
						/>
					))}
				</div>
			) : (
				<div className="grid gap-3">
					{filtered.map((submission) => {
						const scored = isScored(submission.id);
						const acceptedMembers = submission.teamMembers.filter(
							(m) => m.status === "accepted",
						);

						return (
							<Card
								key={submission.id}
								className={`cursor-pointer p-4 transition-colors hover:bg-accent/50 ${
									scored ? "border-emerald-500/30 bg-emerald-500/5" : ""
								}`}
								onClick={() => setActiveSubmission(submission)}
							>
								<div className="flex items-center justify-between gap-3">
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											{scored ? (
												<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
											) : (
												<Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
											)}
											<span className="text-sm font-medium truncate">
												{submission.projectName}
											</span>
										</div>
										{submission.shortDescription && (
											<p className="mt-1 text-xs text-muted-foreground line-clamp-1 pl-6">
												{submission.shortDescription}
											</p>
										)}
									</div>

									<div className="flex items-center gap-3 shrink-0">
										<div className="flex items-center gap-1 text-xs text-muted-foreground">
											<Users className="h-3 w-3" />
											{acceptedMembers.length}
										</div>
										<Badge variant={scored ? "default" : "outline"}>
											{scored ? "Calificado" : "Pendiente"}
										</Badge>
									</div>
								</div>
							</Card>
						);
					})}

					{filtered.length === 0 && (
						<div className="rounded-lg border border-dashed p-8 text-center">
							<p className="text-sm text-muted-foreground">
								{filter === "scored"
									? "No has calificado ningun proyecto"
									: filter === "not_scored"
										? "Todos los proyectos han sido calificados"
										: "No hay proyectos para calificar"}
							</p>
						</div>
					)}
				</div>
			)}

			{activeSubmission && (
				<JudgeScoreCard
					submission={activeSubmission}
					criteria={criteria}
					existingScores={scoredMap.get(activeSubmission.id)}
					onComplete={() => {
						setActiveSubmission(null);
						loadScores();
					}}
				/>
			)}
		</div>
	);
}
