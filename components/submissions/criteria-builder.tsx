"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type { JudgingCriterion } from "@/lib/db/schema";

interface CriteriaBuilderProps {
	criteria: JudgingCriterion[];
	onChange: (criteria: JudgingCriterion[]) => void;
}

export function CriteriaBuilder({ criteria, onChange }: CriteriaBuilderProps) {
	const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

	const addCriterion = () => {
		const newCriterion: JudgingCriterion = {
			id: nanoid(),
			name: "",
			description: undefined,
			weight: 1,
			maxScore: 10,
			order: criteria.length,
		};
		onChange([...criteria, newCriterion]);
	};

	const updateCriterion = (
		index: number,
		update: Partial<JudgingCriterion>,
	) => {
		onChange(criteria.map((c, i) => (i === index ? { ...c, ...update } : c)));
	};

	const removeCriterion = (index: number) => {
		onChange(
			criteria
				.filter((_, i) => i !== index)
				.map((c, i) => ({ ...c, order: i })),
		);
	};

	const moveCriterion = (index: number, direction: "up" | "down") => {
		const targetIndex = direction === "up" ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= criteria.length) return;

		const next = [...criteria];
		const temp = next[index];
		next[index] = next[targetIndex];
		next[targetIndex] = temp;
		onChange(next.map((c, i) => ({ ...c, order: i })));
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-sm font-medium">Criterios de evaluacion</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						Define como los jueces evaluaran las entregas
					</p>
				</div>
				{totalWeight > 0 && (
					<Badge variant="secondary" className="font-mono">
						Peso total: {totalWeight}
					</Badge>
				)}
			</div>

			{criteria.length === 0 && (
				<div className="rounded-lg border border-dashed p-6 text-center">
					<p className="text-sm text-muted-foreground">
						No hay criterios definidos. Agrega al menos uno para habilitar la
						evaluacion.
					</p>
				</div>
			)}

			<div className="space-y-3">
				{criteria.map((criterion, index) => {
					const weightPercentage =
						totalWeight > 0
							? Math.round((criterion.weight / totalWeight) * 100)
							: 0;

					return (
						<div
							key={criterion.id}
							className="rounded-lg border bg-card p-4 space-y-3"
						>
							<div className="flex items-start gap-2">
								<div className="flex flex-col gap-0.5 mt-0.5">
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										disabled={index === 0}
										onClick={() => moveCriterion(index, "up")}
										className="size-6"
									>
										<ChevronUp className="size-3.5" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										disabled={index === criteria.length - 1}
										onClick={() => moveCriterion(index, "down")}
										className="size-6"
									>
										<ChevronDown className="size-3.5" />
									</Button>
								</div>

								<div className="flex-1 space-y-3">
									<Input
										value={criterion.name}
										onChange={(e) =>
											updateCriterion(index, { name: e.target.value })
										}
										placeholder="Ej: Innovacion, Impacto, Diseno..."
										className="font-medium"
									/>

									<Textarea
										value={criterion.description ?? ""}
										onChange={(e) =>
											updateCriterion(index, {
												description: e.target.value || undefined,
											})
										}
										placeholder="Descripcion del criterio (opcional)"
										className="min-h-10 text-sm"
									/>

									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<Label className="text-xs text-muted-foreground font-normal">
													Peso
												</Label>
												<span className="text-xs tabular-nums text-muted-foreground">
													{criterion.weight}/10 ({weightPercentage}%)
												</span>
											</div>
											<Slider
												value={[criterion.weight]}
												onValueChange={([value]) =>
													updateCriterion(index, { weight: value })
												}
												min={1}
												max={10}
												step={1}
											/>
										</div>

										<div className="space-y-2">
											<Label className="text-xs text-muted-foreground font-normal">
												Puntaje maximo
											</Label>
											<Select
												value={String(criterion.maxScore)}
												onValueChange={(v) =>
													updateCriterion(index, { maxScore: Number(v) })
												}
											>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="5">5 puntos</SelectItem>
													<SelectItem value="10">10 puntos</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								</div>

								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => removeCriterion(index)}
									className="text-muted-foreground hover:text-destructive"
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
						</div>
					);
				})}
			</div>

			<Button
				type="button"
				variant="outline"
				onClick={addCriterion}
				className="w-full"
			>
				<Plus className="size-4" />
				Agregar criterio
			</Button>
		</div>
	);
}
