import { auth, currentUser } from "@clerk/nextjs/server";

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];

export async function isGodMode(): Promise<boolean> {
	try {
		const user = await currentUser();
		if (!user) return false;

		const primaryEmail = user.emailAddresses.find(
			(email) => email.id === user.primaryEmailAddressId,
		)?.emailAddress;

		if (!primaryEmail) return false;

		return ADMIN_EMAILS.includes(primaryEmail);
	} catch {
		return false;
	}
}

export async function requireGodMode(): Promise<void> {
	const isGod = await isGodMode();
	if (!isGod) {
		throw new Error("God mode required");
	}
}

export async function getGodModeUser() {
	const { userId } = await auth();
	if (!userId) return null;

	const user = await currentUser();
	if (!user) return null;

	const primaryEmail = user.emailAddresses.find(
		(email) => email.id === user.primaryEmailAddressId,
	)?.emailAddress;

	if (!primaryEmail || !ADMIN_EMAILS.includes(primaryEmail)) {
		return null;
	}

	return {
		id: user.id,
		email: primaryEmail,
		firstName: user.firstName,
		lastName: user.lastName,
		imageUrl: user.imageUrl,
	};
}
