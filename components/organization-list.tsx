"use client";

import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type {
	OrganizationFilters,
	PublicOrganization,
} from "@/lib/actions/organizations";
import { ORGANIZER_TYPE_LABELS } from "@/lib/db/schema";

interface OrganizationListProps {
	organizations: PublicOrganization[];
	total?: number;
	hasMore?: boolean;
	filters?: OrganizationFilters;
}

type SortField = "name" | "type" | "events";
type SortDirection = "asc" | "desc";

export function OrganizationList({
	organizations,
	total,
	hasMore = false,
	filters = {},
}: OrganizationListProps) {
	const [sortField, setSortField] = useState<SortField>("events");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

	const sortedOrganizations = useMemo(() => {
		const result = [...organizations];

		result.sort((a, b) => {
			let comparison = 0;
			switch (sortField) {
				case "name":
					comparison = (a.displayName || a.name).localeCompare(
						b.displayName || b.name,
					);
					break;
				case "type":
					comparison = (a.type || "").localeCompare(b.type || "");
					break;
				case "events":
					comparison = a.eventCount - b.eventCount;
					break;
			}
			return sortDirection === "asc" ? comparison : -comparison;
		});

		return result;
	}, [organizations, sortField, sortDirection]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection(field === "events" ? "desc" : "asc");
		}
	};

	const SortIcon = ({ field }: { field: SortField }) => {
		if (sortField !== field)
			return <ChevronDown className="h-2.5 w-2.5 opacity-30" />;
		return sortDirection === "asc" ? (
			<ChevronUp className="h-2.5 w-2.5" />
		) : (
			<ChevronDown className="h-2.5 w-2.5" />
		);
	};

	if (organizations.length === 0) {
		return (
			<div className="py-12 text-center text-xs text-muted-foreground">
				No se encontraron organizaciones
			</div>
		);
	}

	return (
		<div className="text-xs">
			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						<tr className="border-b border-border text-left text-muted-foreground">
							<th className="pb-2 pr-4 font-medium">
								<button
									onClick={() => handleSort("name")}
									className="flex items-center gap-1 hover:text-foreground"
								>
									Organización <SortIcon field="name" />
								</button>
							</th>
							<th className="pb-2 pr-4 font-medium hidden md:table-cell">
								<button
									onClick={() => handleSort("type")}
									className="flex items-center gap-1 hover:text-foreground"
								>
									Tipo <SortIcon field="type" />
								</button>
							</th>
							<th className="pb-2 font-medium text-right">
								<button
									onClick={() => handleSort("events")}
									className="flex items-center gap-1 justify-end hover:text-foreground"
								>
									Eventos <SortIcon field="events" />
								</button>
							</th>
						</tr>
					</thead>
					<tbody>
						{sortedOrganizations.map((org) => (
							<tr
								key={org.id}
								className="border-b border-border/50 hover:bg-muted/30"
							>
								<td className="py-2 pr-4">
									<Link
										href={`/c/${org.slug}`}
										className="group flex items-center gap-2"
									>
										<div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted">
											{org.logoUrl ? (
												<Image
													src={org.logoUrl}
													alt={org.displayName || org.name}
													fill
													className="object-cover"
													sizes="24px"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center text-[9px] font-medium text-muted-foreground">
													{(org.displayName || org.name).charAt(0)}
												</div>
											)}
										</div>
										<div className="min-w-0">
											<span className="text-foreground group-hover:underline underline-offset-2 line-clamp-1 flex items-center gap-1">
												{org.displayName || org.name}
												{org.isVerified && (
													<CheckCircle2 className="h-3 w-3 text-emerald-500" />
												)}
											</span>
											<div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
												@{org.slug}
											</div>
										</div>
									</Link>
								</td>
								<td className="py-2 pr-4 text-muted-foreground hidden md:table-cell">
									{org.type ? ORGANIZER_TYPE_LABELS[org.type] || org.type : "—"}
								</td>
								<td className="py-2 text-right">
									<span
										className={
											org.eventCount > 0
												? "text-foreground"
												: "text-muted-foreground/50"
										}
									>
										{org.eventCount}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
