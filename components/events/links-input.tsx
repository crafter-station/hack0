"use client";

import { Globe, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LinksInputProps {
	websiteUrl: string;
	registrationUrl: string;
	onWebsiteUrlChange: (value: string) => void;
	onRegistrationUrlChange: (value: string) => void;
}

export function LinksInput({
	websiteUrl,
	registrationUrl,
	onWebsiteUrlChange,
	onRegistrationUrlChange,
}: LinksInputProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-sm font-medium">
				<Globe className="h-4 w-4" />
				Enlaces
			</div>

			<div className="rounded-lg border bg-card overflow-hidden divide-y transition-colors has-[:focus]:border-primary/50 has-[:focus]:ring-1 has-[:focus]:ring-primary/20">
				<div className="group p-4 space-y-2 transition-colors hover:bg-muted/20 has-[:focus]:bg-muted/30">
					<label
						htmlFor="website-url"
						className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2 group-has-[:focus]:text-primary transition-colors"
					>
						<Globe className="h-3.5 w-3.5" />
						Sitio web
					</label>
					<Input
						id="website-url"
						type="url"
						value={websiteUrl}
						onChange={(e) => onWebsiteUrlChange(e.target.value)}
						placeholder="https://ejemplo.com"
						className="border-0 shadow-none px-2 py-1.5 h-auto text-sm font-mono focus-visible:ring-0 rounded-md bg-black/5 dark:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
					/>
				</div>

				<div className="group p-4 space-y-2 transition-colors hover:bg-muted/20 has-[:focus]:bg-muted/30">
					<label
						htmlFor="registration-url"
						className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2 group-has-[:focus]:text-primary transition-colors"
					>
						<LinkIcon className="h-3.5 w-3.5" />
						Enlace de registro
					</label>
					<Input
						id="registration-url"
						type="url"
						value={registrationUrl}
						onChange={(e) => onRegistrationUrlChange(e.target.value)}
						placeholder="https://registro.com"
						className="border-0 shadow-none px-2 py-1.5 h-auto text-sm font-mono focus-visible:ring-0 rounded-md bg-black/5 dark:bg-white/5 focus:bg-black/10 dark:focus:bg-white/10"
					/>
				</div>
			</div>
		</div>
	);
}
