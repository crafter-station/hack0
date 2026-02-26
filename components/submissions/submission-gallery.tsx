import { FolderOpen } from "lucide-react";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import type { Submission, SubmissionTeamMember } from "@/lib/db/schema";

import { SubmissionCard } from "./submission-card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubmissionGalleryProps {
	submissions: (Submission & { teamMembers: SubmissionTeamMember[] })[];
	eventCode: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubmissionGallery({
	submissions,
	eventCode,
}: SubmissionGalleryProps) {
	if (submissions.length === 0) {
		return (
			<Empty className="border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<FolderOpen />
					</EmptyMedia>
					<EmptyTitle>No hay proyectos todavia</EmptyTitle>
					<EmptyDescription>
						Los proyectos enviados apareceran aqui una vez que los equipos
						completen sus entregas.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<p className="text-sm text-muted-foreground">
				{submissions.length}{" "}
				{submissions.length === 1 ? "proyecto" : "proyectos"}
			</p>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{submissions.map((submission) => (
					<SubmissionCard
						key={submission.id}
						submission={submission}
						eventCode={eventCode}
					/>
				))}
			</div>
		</div>
	);
}
