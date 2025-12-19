"use client";

import { Building2, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	addEventSponsor,
	type EventSponsorWithOrg,
	removeEventSponsor,
	updateEventSponsor,
} from "@/lib/actions/events";
import { searchOrganizations } from "@/lib/actions/organizations";
import type { Organization } from "@/lib/db/schema";
import { SPONSOR_TIER_LABELS } from "@/lib/db/schema";

interface SponsorManagerProps {
	eventId: string;
	sponsors: EventSponsorWithOrg[];
	onUpdate?: () => void;
}

const TIER_OPTIONS = Object.entries(SPONSOR_TIER_LABELS).map(
	([value, label]) => ({ value, label }),
);

export function SponsorManager({
	eventId,
	sponsors: initialSponsors,
	onUpdate,
}: SponsorManagerProps) {
	const [sponsors, setSponsors] = useState(initialSponsors);
	const [isAdding, setIsAdding] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Organization[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
	const [selectedTier, setSelectedTier] = useState<string>("partner");

	const handleSearch = async (query: string) => {
		setSearchQuery(query);
		if (query.length < 2) {
			setSearchResults([]);
			return;
		}

		setIsSearching(true);
		const results = await searchOrganizations(query);
		setSearchResults(results);
		setIsSearching(false);
	};

	const handleAddSponsor = async () => {
		if (!selectedOrg) return;

		const result = await addEventSponsor({
			eventId,
			organizationId: selectedOrg.id,
			tier: selectedTier as any,
		});

		if (result.success && result.eventSponsor) {
			setSponsors([
				...sponsors,
				{ ...result.eventSponsor, organization: selectedOrg },
			]);
			setIsAdding(false);
			setSelectedOrg(null);
			setSearchQuery("");
			setSearchResults([]);
			onUpdate?.();
		}
	};

	const handleRemoveSponsor = async (sponsorId: string) => {
		const result = await removeEventSponsor(sponsorId);
		if (result.success) {
			setSponsors(sponsors.filter((s) => s.id !== sponsorId));
			onUpdate?.();
		}
	};

	const handleUpdateTier = async (sponsorId: string, tier: string) => {
		const result = await updateEventSponsor(sponsorId, { tier: tier as any });
		if (result.success) {
			setSponsors(
				sponsors.map((s) =>
					s.id === sponsorId ? { ...s, tier: tier as any } : s,
				),
			);
			onUpdate?.();
		}
	};

	return (
		<FieldGroup className="gap-6">
			<Field>
				<FieldLabel>
					<Building2 className="h-4 w-4" />
					Sponsors
				</FieldLabel>
				<FieldDescription>
					Comunidades que patrocinan este evento
				</FieldDescription>
			</Field>

			{sponsors.length > 0 && (
				<div className="space-y-3">
					{sponsors.map((sponsor) => (
						<div
							key={sponsor.id}
							className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
						>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">
									{sponsor.organization.name}
								</p>
								<p className="text-xs text-muted-foreground">
									{sponsor.organization.slug}
								</p>
							</div>
							<Select
								value={sponsor.tier || "partner"}
								onValueChange={(value) => handleUpdateTier(sponsor.id, value)}
							>
								<SelectTrigger className="w-32">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TIER_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => handleRemoveSponsor(sponsor.id)}
							>
								<Trash2 className="h-4 w-4 text-muted-foreground" />
							</Button>
						</div>
					))}
				</div>
			)}

			{!isAdding ? (
				<Button
					type="button"
					variant="outline"
					onClick={() => setIsAdding(true)}
					className="w-full"
				>
					<Plus className="h-4 w-4" />
					Agregar sponsor
				</Button>
			) : (
				<div className="space-y-3 p-4 rounded-lg border bg-muted/20">
					<div className="flex items-center justify-between">
						<p className="text-sm font-medium">Agregar sponsor</p>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => {
								setIsAdding(false);
								setSelectedOrg(null);
								setSearchQuery("");
								setSearchResults([]);
							}}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar comunidad..."
							value={searchQuery}
							onChange={(e) => handleSearch(e.target.value)}
							className="pl-9"
						/>
					</div>

					{isSearching && (
						<div className="flex items-center justify-center py-4">
							<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						</div>
					)}

					{searchResults.length > 0 && !selectedOrg && (
						<div className="space-y-2 max-h-48 overflow-y-auto">
							{searchResults.map((org) => (
								<button
									type="button"
									key={org.id}
									onClick={() => setSelectedOrg(org)}
									className="w-full text-left p-2 rounded hover:bg-muted/50 transition-colors"
								>
									<p className="text-sm font-medium">{org.name}</p>
									<p className="text-xs text-muted-foreground">{org.slug}</p>
								</button>
							))}
						</div>
					)}

					{selectedOrg && (
						<div className="space-y-3">
							<div className="p-3 rounded-lg border bg-background">
								<p className="text-sm font-medium">{selectedOrg.name}</p>
								<p className="text-xs text-muted-foreground">
									{selectedOrg.slug}
								</p>
							</div>

							<Field>
								<FieldLabel htmlFor="sponsorTier">
									Nivel de sponsorship
								</FieldLabel>
								<Select value={selectedTier} onValueChange={setSelectedTier}>
									<SelectTrigger id="sponsorTier">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{TIER_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>

							<Button
								type="button"
								onClick={handleAddSponsor}
								className="w-full"
							>
								<Plus className="h-4 w-4" />
								Agregar
							</Button>
						</div>
					)}
				</div>
			)}
		</FieldGroup>
	);
}
