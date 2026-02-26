import { Award, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { Submission, SubmissionTeamMember } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubmissionCardProps {
	submission: Submission & { teamMembers: SubmissionTeamMember[] };
	eventCode: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
	string,
	{ label: string; className: string; icon?: typeof Trophy }
> = {
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
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubmissionCard({ submission, eventCode }: SubmissionCardProps) {
	const status = submission.status ?? "submitted";
	const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.submitted;
	const acceptedMembers = submission.teamMembers.filter(
		(m) => m.status === "accepted",
	);

	const isHighlighted = status === "winner" || status === "finalist";

	return (
		<Link href={`/e/${eventCode}/submissions/${submission.projectSlug}`}>
			<Card
				className={`transition-colors hover:bg-muted/30 ${
					isHighlighted
						? "border-amber-500/30 shadow-amber-500/5 shadow-md"
						: ""
				}`}
			>
				<CardHeader>
					<div className="flex items-start justify-between gap-2">
						<div className="flex flex-col gap-1.5 min-w-0">
							<CardTitle className="truncate text-base">
								{config.icon && (
									<config.icon className="mr-1.5 inline-block size-4 text-amber-500" />
								)}
								{submission.projectName}
							</CardTitle>
							{submission.shortDescription && (
								<CardDescription className="line-clamp-2">
									{submission.shortDescription}
								</CardDescription>
							)}
						</div>
						<Badge className={config.className}>{config.label}</Badge>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<Users className="size-3.5" />
						<span>
							{acceptedMembers.length}{" "}
							{acceptedMembers.length === 1 ? "miembro" : "miembros"}
						</span>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
