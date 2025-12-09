"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface OnboardingGuardProps {
	hasCompletedOnboarding: boolean;
	isAuthenticated: boolean;
}

const ALLOWED_PATHS_WITHOUT_ONBOARDING = [
	"/onboarding",
	"/onboarding/redirect",
	"/sign-in",
	"/sign-up",
	"/api",
];

export function OnboardingGuard({
	hasCompletedOnboarding,
	isAuthenticated,
}: OnboardingGuardProps) {
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (!isAuthenticated) return;

		const isAllowedPath = ALLOWED_PATHS_WITHOUT_ONBOARDING.some((path) =>
			pathname.startsWith(path),
		);

		if (!hasCompletedOnboarding && !isAllowedPath) {
			router.push("/onboarding");
		}
	}, [hasCompletedOnboarding, isAuthenticated, pathname, router]);

	return null;
}
