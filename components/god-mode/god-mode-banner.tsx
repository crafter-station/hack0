import { Zap } from "lucide-react";
import Link from "next/link";
import { getGodModeUser } from "@/lib/god-mode";

export async function GodModeBanner() {
	const godUser = await getGodModeUser();

	if (!godUser) return null;

	return (
		<div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-2">
				<div className="flex items-center gap-2 text-sm">
					<Zap className="h-4 w-4 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
					<span className="font-medium text-amber-900 dark:text-amber-100">
						God Mode
					</span>
					<span className="text-amber-700 dark:text-amber-300">
						• {godUser.email}
					</span>
					<span className="text-amber-600 dark:text-amber-400 text-xs ml-auto hidden sm:inline">
						Onboarding bypassed • Create events anywhere • Full access
					</span>
					<Link
						href="/god"
						className="text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline ml-2"
					>
						Panel
					</Link>
				</div>
			</div>
		</div>
	);
}
