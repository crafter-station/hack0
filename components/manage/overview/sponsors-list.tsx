import { Building2, ExternalLink, Trophy } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventSponsorWithOrg } from "@/lib/actions/events";

interface SponsorsListProps {
	sponsors: EventSponsorWithOrg[];
}

export function SponsorsList({ sponsors }: SponsorsListProps) {
	if (sponsors.length === 0) {
		return null;
	}

	return (
		<Card>
			<CardHeader className="pb-4">
				<CardTitle className="text-sm font-medium flex items-center gap-2">
					<Trophy className="h-4 w-4 text-muted-foreground" />
					Sponsors ({sponsors.length})
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-3">
					{sponsors.map((sponsor) => (
						<div
							key={sponsor.id}
							className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 min-w-[200px]"
						>
							{sponsor.organization.logoUrl ? (
								<div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border bg-background">
									<Image
										src={sponsor.organization.logoUrl}
										alt={sponsor.organization.name}
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background border">
									<Building2 className="h-5 w-5 text-muted-foreground" />
								</div>
							)}

							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">
									{sponsor.organization.displayName ||
										sponsor.organization.name}
								</p>
							</div>

							{sponsor.organization.websiteUrl && (
								<a
									href={sponsor.organization.websiteUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<ExternalLink className="h-3.5 w-3.5" />
									</Button>
								</a>
							)}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
