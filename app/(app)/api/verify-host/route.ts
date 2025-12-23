import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { verifyHostClaim } from "@/lib/actions/host-claims";

export async function GET(request: NextRequest) {
	const token = request.nextUrl.searchParams.get("token");

	if (!token) {
		redirect("/profile?error=invalid_token");
	}

	const result = await verifyHostClaim(token);

	if (result.success && result.organizationSlug) {
		redirect(`/c/${result.organizationSlug}?host_verified=true`);
	} else if (result.success) {
		redirect("/profile?host_verified=true");
	} else {
		redirect(`/profile?error=${encodeURIComponent(result.error || "unknown")}`);
	}
}
