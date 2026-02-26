import { notFound } from "next/navigation";
import { SubmissionDetail } from "@/components/submissions/submission-detail";
import { getEventByShortCode } from "@/lib/actions/events";
import { canManageEventById } from "@/lib/actions/permissions";
import { getSubmissionBySlug } from "@/lib/actions/submissions";

interface SubmissionDetailPageProps {
	params: Promise<{ code: string; slug: string }>;
}

export default async function SubmissionDetailPage({
	params,
}: SubmissionDetailPageProps) {
	const { code, slug } = await params;

	const event = await getEventByShortCode(code);
	if (!event) {
		notFound();
	}

	const submission = await getSubmissionBySlug(event.id, slug);
	if (!submission || submission.status === "draft") {
		notFound();
	}

	const isOrganizer = await canManageEventById(event.id);

	return (
		<div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-8">
			<SubmissionDetail
				submission={submission}
				eventCode={code}
				isOrganizer={isOrganizer}
			/>
		</div>
	);
}
