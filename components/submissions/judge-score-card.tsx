"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { submitJudgeScore } from "@/lib/actions/submissions";
import type { JudgeScore, JudgingCriterion, Submission } from "@/lib/db/schema";

interface CriterionScore {
	criterionId: string;
	score: number;
	comment: string;
}

interface JudgeScoreCardProps {
	submission: Submission;
	criteria: JudgingCriterion[];
	existingScores?: JudgeScore[];
	onComplete: () => void;
}

export function JudgeScoreCard({
	submission,
	criteria,
	existingScores,
	onComplete,
}: JudgeScoreCardProps) {
	const sorted = [...criteria].sort((a, b) => a.order - b.order);

	const [scores, setScores] = useState<CriterionScore[]>(() =>
		sorted.map((c) => {
			const existing = existingScores?.find((s) => s.criterionId === c.id);
			return {
				criterionId: c.id,
				score: existing?.score ?? 0,
				comment: existing?.comment ?? "",
			};
		}),
	);
	const [isPending, startTransition] = useTransition();

	function updateScore(criterionId: string, value: number) {
		setScores((prev) =>
			prev.map((s) =>
				s.criterionId === criterionId ? { ...s, score: value } : s,
			),
		);
	}

	function updateComment(criterionId: string, comment: string) {
		setScores((prev) =>
			prev.map((s) => (s.criterionId === criterionId ? { ...s, comment } : s)),
		);
	}

	function handleSubmit() {
		startTransition(async () => {
			const result = await submitJudgeScore(
				submission.id,
				scores.map((s) => ({
					criterionId: s.criterionId,
					score: s.score,
					...(s.comment.trim() ? { comment: s.comment.trim() } : {}),
				})),
			);

			if (result.success) {
				toast.success("Puntajes guardados");
				onComplete();
			} else {
				toast.error(result.error ?? "Error al guardar los puntajes");
			}
		});
	}

	const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
	const maxTotal = sorted.reduce((sum, c) => sum + c.maxScore, 0);

	return (
		<Dialog open onOpenChange={(open) => !open && onComplete()}>
			<DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{submission.projectName}</DialogTitle>
					<DialogDescription>
						Califica este proyecto en cada criterio
					</DialogDescription>
				</DialogHeader>

				<DialogBody>
					<div className="space-y-6">
						{sorted.map((criterion) => {
							const entry = scores.find((s) => s.criterionId === criterion.id);
							const score = entry?.score ?? 0;

							return (
								<div key={criterion.id} className="space-y-3">
									<div className="flex items-center justify-between">
										<Label className="text-sm font-medium">
											{criterion.name}
											{criterion.weight !== 1 && (
												<span className="ml-1.5 text-xs text-muted-foreground font-normal">
													(peso: {criterion.weight})
												</span>
											)}
										</Label>
										<span className="text-sm font-mono tabular-nums">
											{score} / {criterion.maxScore}
										</span>
									</div>

									{criterion.description && (
										<p className="text-xs text-muted-foreground">
											{criterion.description}
										</p>
									)}

									<Slider
										min={0}
										max={criterion.maxScore}
										step={1}
										value={[score]}
										onValueChange={([val]) => updateScore(criterion.id, val)}
									/>

									<Textarea
										placeholder="Comentario opcional..."
										value={entry?.comment ?? ""}
										onChange={(e) =>
											updateComment(criterion.id, e.target.value)
										}
										rows={2}
										className="resize-none text-xs"
									/>
								</div>
							);
						})}

						<div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
							<span className="text-sm font-medium">Puntaje total</span>
							<span className="text-lg font-semibold tabular-nums">
								{totalScore} / {maxTotal}
							</span>
						</div>
					</div>
				</DialogBody>

				<DialogFooter>
					<Button variant="outline" onClick={onComplete}>
						Cancelar
					</Button>
					<Button onClick={handleSubmit} disabled={isPending}>
						{isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
						{existingScores?.length ? "Actualizar puntajes" : "Enviar puntajes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
