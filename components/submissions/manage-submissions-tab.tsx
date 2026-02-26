"use client";

import { FileText, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	getEventSubmissions,
	updateSubmissionStatus,
} from "@/lib/actions/submissions";
import type {
	Event,
	Submission,
	SubmissionTeamMember,
	SubmissionTemplate,
} from "@/lib/db/schema";

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

const STATUS_VARIANT: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	draft: "outline",
	submitted: "secondary",
	under_review: "secondary",
	scored: "default",
	winner: "default",
	finalist: "secondary",
	rejected: "destructive",
	disqualified: "destructive",
};

const STATUS_OPTIONS = [
	"submitted",
	"under_review",
	"scored",
	"winner",
	"finalist",
	"rejected",
	"disqualified",
] as const;

interface ManageSubmissionsTabProps {
	event: Event;
	template: SubmissionTemplate | null;
}

export function ManageSubmissionsTab({
	event,
	template,
}: ManageSubmissionsTabProps) {
	const [submissions, setSubmissions] = useState<
		(Submission & { teamMembers: SubmissionTeamMember[] })[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [updatingId, setUpdatingId] = useState<string | null>(null);

	const loadSubmissions = useCallback(async () => {
		setIsLoading(true);
		const data = await getEventSubmissions(event.id);
		setSubmissions(data);
		setIsLoading(false);
	}, [event.id]);

	useEffect(() => {
		if (template) {
			loadSubmissions();
		} else {
			setIsLoading(false);
		}
	}, [template, loadSubmissions]);

	async function handleStatusChange(
		submissionId: string,
		newStatus: (typeof STATUS_OPTIONS)[number],
	) {
		setUpdatingId(submissionId);
		const result = await updateSubmissionStatus(submissionId, newStatus);
		if (result.success) {
			setSubmissions((prev) =>
				prev.map((s) =>
					s.id === submissionId ? { ...s, status: newStatus } : s,
				),
			);
			toast.success("Estado actualizado");
		} else {
			toast.error(result.error ?? "Error al actualizar estado");
		}
		setUpdatingId(null);
	}

	if (!template) {
		return (
			<div className="space-y-4">
				<div className="rounded-lg border border-dashed p-8 text-center">
					<FileText className="mx-auto h-8 w-8 text-muted-foreground" />
					<h3 className="mt-3 text-sm font-medium">Sin template de entregas</h3>
					<p className="mt-1 text-xs text-muted-foreground">
						Crea un template para habilitar entregas de proyectos en este evento
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Template summary */}
			<Card className="p-4">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-sm font-medium">{template.name}</h3>
						{template.description && (
							<p className="mt-0.5 text-xs text-muted-foreground">
								{template.description}
							</p>
						)}
					</div>
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<span>{(template.fields as unknown[])?.length ?? 0} campos</span>
						<span>
							Equipo: {template.minTeamSize}-{template.maxTeamSize}
						</span>
						{template.submissionDeadline && (
							<span>
								Cierre:{" "}
								{new Date(template.submissionDeadline).toLocaleDateString(
									"es-PE",
									{
										day: "numeric",
										month: "short",
										year: "numeric",
									},
								)}
							</span>
						)}
					</div>
				</div>
			</Card>

			{/* Submissions list */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-sm font-medium">
						Entregas ({submissions.length})
					</h3>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : submissions.length === 0 ? (
					<div className="rounded-lg border border-dashed p-8 text-center">
						<p className="text-sm text-muted-foreground">
							Aun no hay entregas registradas
						</p>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Proyecto</TableHead>
								<TableHead>Lider</TableHead>
								<TableHead>Equipo</TableHead>
								<TableHead>Enviado</TableHead>
								<TableHead>Estado</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{submissions.map((submission) => {
								const acceptedMembers = submission.teamMembers.filter(
									(m) => m.status === "accepted",
								);

								return (
									<TableRow key={submission.id}>
										<TableCell>
											<span className="font-medium">
												{submission.projectName}
											</span>
										</TableCell>
										<TableCell className="text-muted-foreground text-xs">
											{submission.leadUserId}
										</TableCell>
										<TableCell className="tabular-nums text-muted-foreground">
											{acceptedMembers.length}
										</TableCell>
										<TableCell className="text-muted-foreground text-xs">
											{submission.submittedAt
												? new Date(submission.submittedAt).toLocaleDateString(
														"es-PE",
														{
															day: "numeric",
															month: "short",
														},
													)
												: "-"}
										</TableCell>
										<TableCell>
											{submission.status === "draft" ? (
												<Badge variant="outline">{STATUS_LABELS.draft}</Badge>
											) : (
												<Select
													value={submission.status ?? "submitted"}
													onValueChange={(val) =>
														handleStatusChange(
															submission.id,
															val as (typeof STATUS_OPTIONS)[number],
														)
													}
													disabled={updatingId === submission.id}
												>
													<SelectTrigger size="sm" className="h-7 text-xs w-32">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{STATUS_OPTIONS.map((status) => (
															<SelectItem key={status} value={status}>
																{STATUS_LABELS[status]}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</div>
		</div>
	);
}
