import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { verifyLumaEmail } from "@/lib/luma/email-verification";

export async function GET(request: NextRequest) {
	const token = request.nextUrl.searchParams.get("token");

	if (!token) {
		redirect("/settings?error=missing_token");
	}

	const result = await verifyLumaEmail(token);

	if (!result.success) {
		const errorParam = encodeURIComponent(result.error || "unknown");
		redirect(`/settings?error=${errorParam}`);
	}

	redirect("/settings?luma_verified=true");
}
