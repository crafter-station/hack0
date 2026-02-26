import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SubmissionForm } from "@/components/submissions/submission-form";
import { getEventByShortCode } from "@/lib/actions/events";
import {
	getMySubmission,
	getSubmissionTemplate,
} from "@/lib/actions/submissions";

interface SubmitPageProps {
	params: Promise<{ code: string }>;
}

export default async function SubmitPage({ params }: SubmitPageProps) {
	const { code } = await params;
	const { userId } = await auth();

	if (!userId) {
		redirect(`/sign-in?redirect_url=/e/${code}/submit`);
	}

	const event = await getEventByShortCode(code);
	if (!event) {
		redirect("/");
	}

	const template = await getSubmissionTemplate(event.id);
	if (!template || !template.isActive) {
		redirect(`/e/${code}`);
	}

	const mySubmission = await getMySubmission(event.id);

	return (
		<div className="mx-auto max-w-screen-lg px-4 lg:px-8 py-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
				<p className="text-sm text-muted-foreground mt-1">{template.name}</p>
				{template.description && (
					<p className="text-sm text-muted-foreground mt-2">
						{template.description}
					</p>
				)}
			</div>

			<SubmissionForm
				eventId={event.id}
				template={template}
				submission={mySubmission ?? undefined}
			/>
		</div>
	);
}
