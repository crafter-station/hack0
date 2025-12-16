import { UserProfile } from "@clerk/nextjs";

export default function ProfilePage() {
	return (
		<div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-8">
			<UserProfile
				appearance={{
					elements: {
						rootBox: "mx-auto w-full",
						cardBox: "shadow-none w-full",
						card: "shadow-none border border-border rounded-lg w-full",
					},
				}}
			/>
		</div>
	);
}
