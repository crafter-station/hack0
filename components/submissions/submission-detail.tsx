import {
	ArrowLeft,
	Award,
	Download,
	ExternalLink,
	FileIcon,
	Trophy,
	Users,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
	JudgeScore,
	Submission,
	SubmissionTeamMember,
	SubmissionTemplate,
	TemplateField,
} from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubmissionDetailProps {
	submission: Submission & {
		teamMembers: SubmissionTeamMember[];
		template: SubmissionTemplate;
		judgeScores: JudgeScore[];
	};
	eventCode: string;
	isOrganizer?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
	string,
	{ label: string; className: string; icon?: typeof Trophy }
> = {
	draft: {
		label: "Borrador",
		className: "border-transparent bg-secondary text-secondary-foreground",
	},
	submitted: {
		label: "Enviado",
		className: "border-transparent bg-secondary text-secondary-foreground",
	},
	under_review: {
		label: "En revision",
		className: "border-transparent bg-blue-500/10 text-blue-600",
	},
	scored: {
		label: "Evaluado",
		className: "border-transparent bg-emerald-500/10 text-emerald-600",
	},
	winner: {
		label: "Ganador",
		className:
			"border-amber-500/30 bg-amber-500/10 text-amber-600 font-semibold",
		icon: Trophy,
	},
	finalist: {
		label: "Finalista",
		className: "border-amber-500/20 bg-amber-500/5 text-amber-600",
		icon: Award,
	},
	rejected: {
		label: "Rechazado",
		className: "border-transparent bg-destructive/10 text-destructive",
	},
	disqualified: {
		label: "Descalificado",
		className: "border-transparent bg-destructive/10 text-destructive",
	},
};

const ROLE_LABELS: Record<string, string> = {
	lead: "Lider",
	developer: "Desarrollador",
	designer: "Disenador",
	pm: "Project Manager",
	other: "Otro",
};

function formatDate(date: Date | null): string {
	if (!date) return "-";
	return new Intl.DateTimeFormat("es-PE", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "America/Lima",
	}).format(new Date(date));
}

function isImageUrl(url: string): boolean {
	const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
	const lower = url.toLowerCase();
	return imageExtensions.some((ext) => lower.includes(ext));
}

// ---------------------------------------------------------------------------
// Field response renderer
// ---------------------------------------------------------------------------

function FieldResponseDisplay({
	field,
	value,
}: {
	field: TemplateField;
	value: string | string[] | number | boolean | undefined;
}) {
	if (value === undefined || value === null || value === "") {
		return (
			<span className="text-sm italic text-muted-foreground">
				Sin respuesta
			</span>
		);
	}

	switch (field.type) {
		case "url":
			return (
				<a
					href={String(value)}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1.5 text-sm text-blue-500 underline underline-offset-2 hover:text-blue-600"
				>
					<ExternalLink className="size-3.5" />
					{String(value)}
				</a>
			);

		case "email":
			return (
				<a
					href={`mailto:${String(value)}`}
					className="text-sm text-blue-500 underline underline-offset-2 hover:text-blue-600"
				>
					{String(value)}
				</a>
			);

		case "file": {
			const url = String(value);
			if (isImageUrl(url)) {
				return (
					<div className="flex flex-col gap-2">
						<img
							src={url}
							alt={field.label}
							className="max-h-64 rounded-md border object-contain"
						/>
						<a
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
						>
							<Download className="size-3" />
							Descargar imagen
						</a>
					</div>
				);
			}

			return (
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
				>
					<FileIcon className="size-4 text-muted-foreground" />
					<span className="truncate">{url.split("/").pop()}</span>
					<Download className="size-3.5 text-muted-foreground" />
				</a>
			);
		}

		case "checkbox":
			return <span className="text-sm">{value ? "Si" : "No"}</span>;

		case "multiselect": {
			const items = Array.isArray(value) ? value : [];
			if (items.length === 0) {
				return (
					<span className="text-sm italic text-muted-foreground">
						Sin seleccion
					</span>
				);
			}
			return (
				<div className="flex flex-wrap gap-1.5">
					{items.map((item) => {
						const option = field.options?.find((o) => o.value === item);
						return (
							<Badge key={item} variant="secondary">
								{option?.label ?? item}
							</Badge>
						);
					})}
				</div>
			);
		}

		case "select": {
			const option = field.options?.find((o) => o.value === String(value));
			return <span className="text-sm">{option?.label ?? String(value)}</span>;
		}

		case "textarea":
		case "richtext":
			return (
				<p className="whitespace-pre-wrap text-sm leading-relaxed">
					{String(value)}
				</p>
			);

		default:
			return <span className="text-sm">{String(value)}</span>;
	}
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SubmissionDetail({
	submission,
	eventCode,
	isOrganizer = false,
}: SubmissionDetailProps) {
	const status = submission.status ?? "submitted";
	const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.submitted;
	const isHighlighted = status === "winner" || status === "finalist";

	const acceptedMembers = submission.teamMembers.filter(
		(m) => m.status === "accepted",
	);

	const sortedFields = [...(submission.template.fields ?? [])].sort(
		(a, b) => a.order - b.order,
	);

	const responses = (submission.responses ?? {}) as Record<
		string,
		string | string[] | number | boolean
	>;

	const showScore =
		isOrganizer ||
		status === "scored" ||
		status === "winner" ||
		status === "finalist";

	return (
		<div className="flex flex-col gap-6">
			{/* Back link */}
			<Link
				href={`/e/${eventCode}/submissions`}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				Volver a proyectos
			</Link>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
				{/* Left column: Content */}
				<div className="flex flex-col gap-8">
					{/* Header */}
					<div className="flex flex-col gap-3">
						<div className="flex items-start gap-3">
							{config.icon && (
								<config.icon className="mt-1 size-6 text-amber-500" />
							)}
							<h1
								className={`text-2xl font-bold tracking-tight ${
									isHighlighted ? "text-amber-600" : ""
								}`}
							>
								{submission.projectName}
							</h1>
						</div>
						{submission.shortDescription && (
							<p className="text-muted-foreground">
								{submission.shortDescription}
							</p>
						)}
					</div>

					{/* Field responses */}
					{sortedFields.length > 0 && (
						<div className="flex flex-col gap-6">
							{sortedFields.map((field) => {
								const value = responses[field.id];
								// Skip fields with conditional visibility that don't match
								if (field.conditional) {
									const condFieldValue = responses[field.conditional.fieldId];
									const visible = (() => {
										switch (field.conditional.operator) {
											case "equals":
												return (
													String(condFieldValue ?? "") ===
													field.conditional.value
												);
											case "notEquals":
												return (
													String(condFieldValue ?? "") !==
													field.conditional.value
												);
											case "contains":
												return String(condFieldValue ?? "").includes(
													field.conditional.value ?? "",
												);
											case "isEmpty":
												return !condFieldValue;
											case "isNotEmpty":
												return !!condFieldValue;
											default:
												return true;
										}
									})();

									if (!visible) return null;
								}

								return (
									<div key={field.id} className="flex flex-col gap-1.5">
										<h3 className="text-sm font-medium">{field.label}</h3>
										{field.description && (
											<p className="text-xs text-muted-foreground">
												{field.description}
											</p>
										)}
										<FieldResponseDisplay field={field} value={value} />
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Right column: Sidebar */}
				<div className="flex flex-col gap-4">
					{/* Status */}
					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Estado</CardTitle>
						</CardHeader>
						<CardContent>
							<Badge className={config.className}>
								{config.icon && <config.icon className="mr-1 size-3" />}
								{config.label}
							</Badge>
						</CardContent>
					</Card>

					{/* Score */}
					{showScore && submission.averageScore !== null && (
						<Card
							className={
								isHighlighted
									? "border-amber-500/30 shadow-amber-500/5 shadow-md"
									: ""
							}
						>
							<CardHeader>
								<CardTitle className="text-sm">Puntaje</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-col gap-1">
									<span
										className={`text-3xl font-bold tabular-nums ${
											isHighlighted ? "text-amber-600" : ""
										}`}
									>
										{submission.averageScore}
										<span className="text-base font-normal text-muted-foreground">
											/100
										</span>
									</span>
									{submission.rank && (
										<span className="text-xs text-muted-foreground">
											Posicion #{submission.rank}
										</span>
									)}
									{submission.judgeCount !== null &&
										submission.judgeCount > 0 && (
											<span className="text-xs text-muted-foreground">
												{submission.judgeCount}{" "}
												{submission.judgeCount === 1 ? "juez" : "jueces"}
											</span>
										)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Team members */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-1.5 text-sm">
								<Users className="size-4" />
								Equipo ({acceptedMembers.length})
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="flex flex-col gap-2">
								{acceptedMembers.map((member) => (
									<li
										key={member.id}
										className="flex items-center justify-between gap-2"
									>
										<span className="truncate text-sm">{member.userId}</span>
										<Badge variant="outline" className="shrink-0 text-xs">
											{ROLE_LABELS[member.role ?? "developer"] ?? member.role}
										</Badge>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>

					{/* Submission date */}
					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Detalles</CardTitle>
						</CardHeader>
						<CardContent>
							<dl className="flex flex-col gap-2 text-sm">
								<div className="flex items-center justify-between gap-2">
									<dt className="text-muted-foreground">Enviado</dt>
									<dd className="text-right">
										{formatDate(submission.submittedAt)}
									</dd>
								</div>
								{submission.editedAt && (
									<div className="flex items-center justify-between gap-2">
										<dt className="text-muted-foreground">Editado</dt>
										<dd className="text-right">
											{formatDate(submission.editedAt)}
										</dd>
									</div>
								)}
							</dl>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
