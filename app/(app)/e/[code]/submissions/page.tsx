import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmissionGallery } from "@/components/submissions/submission-gallery";
import { Button } from "@/components/ui/button";
import { getEventByShortCode } from "@/lib/actions/events";
import {
	getEventSubmissions,
	getSubmissionTemplate,
} from "@/lib/actions/submissions";

interface SubmissionsPageProps {
	params: Promise<{ code: string }>;
}

export default async function SubmissionsPage({
	params,
}: SubmissionsPageProps) {
	const { code } = await params;

	const event = await getEventByShortCode(code);
	if (!event) {
		notFound();
	}

	const template = await getSubmissionTemplate(event.id);
	const allSubmissions = template ? await getEventSubmissions(event.id) : [];

	// Public gallery: only show submitted+ projects
	const publicSubmissions = allSubmissions.filter((s) => s.status !== "draft");

	return (
		<div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Proyectos — {event.name}
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{publicSubmissions.length} proyecto(s) enviado(s)
					</p>
				</div>
				{template?.isActive && (
					<Link href={`/e/${code}/submit`}>
						<Button>Enviar proyecto</Button>
					</Link>
				)}
			</div>

			<SubmissionGallery submissions={publicSubmissions} eventCode={code} />
		</div>
	);
}
