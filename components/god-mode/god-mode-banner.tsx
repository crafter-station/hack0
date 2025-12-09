import { getGodModeUser } from "@/lib/god-mode";
import { Crown } from "lucide-react";

export async function GodModeBanner() {
	const godUser = await getGodModeUser();

	if (!godUser) return null;

	return (
		<div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-2">
				<div className="flex items-center gap-2 text-sm">
					<Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
					<span className="font-medium text-amber-900 dark:text-amber-100">
						God Mode
					</span>
					<span className="text-amber-700 dark:text-amber-300">
						• {godUser.email}
					</span>
					<span className="text-amber-600 dark:text-amber-400 text-xs ml-auto">
						Onboarding bypassed • Create events anywhere • Full access
					</span>
				</div>
			</div>
		</div>
	);
}
