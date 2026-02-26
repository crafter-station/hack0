import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TeamInviteAccept } from "@/components/submissions/team-invite-accept";

interface TeamInvitePageProps {
	params: Promise<{ code: string; token: string }>;
}

export default async function TeamInvitePage({ params }: TeamInvitePageProps) {
	const { code, token } = await params;
	const { userId } = await auth();

	if (!userId) {
		redirect(`/sign-in?redirect_url=/e/${code}/team-invite/${token}`);
	}

	return (
		<div className="mx-auto max-w-screen-md px-4 py-16">
			<TeamInviteAccept token={token} eventCode={code} />
		</div>
	);
}
