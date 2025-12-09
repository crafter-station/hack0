"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ImageUpload } from "@/components/ui/image-upload";
import { godModeCreateEvent } from "@/lib/actions/god-mode";
import { Loader2, Sparkles } from "lucide-react";
import type { Organization } from "@/lib/db/schema";

const PERU_DEPARTMENTS = [
	{ value: "Lima", label: "Lima" },
	{ value: "Arequipa", label: "Arequipa" },
	{ value: "Cusco", label: "Cusco" },
	{ value: "La Libertad", label: "La Libertad" },
	{ value: "Piura", label: "Piura" },
	{ value: "Lambayeque", label: "Lambayeque" },
	{ value: "Junín", label: "Junín" },
	{ value: "Ica", label: "Ica" },
	{ value: "Puno", label: "Puno" },
	{ value: "Cajamarca", label: "Cajamarca" },
	{ value: "Ancash", label: "Ancash" },
	{ value: "Huánuco", label: "Huánuco" },
	{ value: "San Martín", label: "San Martín" },
	{ value: "Loreto", label: "Loreto" },
	{ value: "Ucayali", label: "Ucayali" },
	{ value: "Madre de Dios", label: "Madre de Dios" },
	{ value: "Ayacucho", label: "Ayacucho" },
	{ value: "Apurímac", label: "Apurímac" },
	{ value: "Huancavelica", label: "Huancavelica" },
	{ value: "Tacna", label: "Tacna" },
	{ value: "Moquegua", label: "Moquegua" },
	{ value: "Pasco", label: "Pasco" },
	{ value: "Tumbes", label: "Tumbes" },
	{ value: "Amazonas", label: "Amazonas" },
	{ value: "Callao", label: "Callao" },
];

interface GodModeEventFormProps {
	organizations: Organization[];
}

export function GodModeEventForm({ organizations }: GodModeEventFormProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [organizationId, setOrganizationId] = useState("");
	const [department, setDepartment] = useState("");
	const [eventImageUrl, setEventImageUrl] = useState("");

	const orgOptions = organizations.map((org) => ({
		value: org.id,
		label: org.displayName || org.name,
		description: org.slug,
	}));

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		const formData = new FormData(e.currentTarget);

		try {
			const result = await godModeCreateEvent({
				name: formData.get("name") as string,
				organizationId: organizationId || undefined,
				description: (formData.get("description") as string) || undefined,
				eventType: (formData.get("eventType") as string) || undefined,
				startDate: formData.get("startDate")
					? new Date(formData.get("startDate") as string)
					: undefined,
				endDate: formData.get("endDate")
					? new Date(formData.get("endDate") as string)
					: undefined,
				format: (formData.get("format") as any) || "hybrid",
				country: (formData.get("country") as string) || undefined,
				department: department || undefined,
				city: (formData.get("city") as string) || undefined,
				venue: (formData.get("venue") as string) || undefined,
				websiteUrl: (formData.get("websiteUrl") as string) || undefined,
				registrationUrl:
					(formData.get("registrationUrl") as string) || undefined,
				eventImageUrl: eventImageUrl || undefined,
				skillLevel: (formData.get("skillLevel") as any) || "all",
				prizePool: formData.get("prizePool")
					? Number(formData.get("prizePool"))
					: undefined,
				prizeCurrency: (formData.get("prizeCurrency") as any) || "USD",
				isApproved: true,
			});

			if (result.success) {
				router.push(`/events/${result.event.slug}`);
				router.refresh();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error al crear evento");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			<div className="rounded-lg border bg-card p-6 space-y-6">
				<h2 className="text-lg font-semibold">Basic Information</h2>

				<div className="space-y-2">
					<Label htmlFor="name">Event Name *</Label>
					<Input
						id="name"
						name="name"
						placeholder="HackLima 2025"
						required
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="organization">Organization (optional)</Label>
					<SearchableSelect
						options={orgOptions}
						value={organizationId}
						onValueChange={setOrganizationId}
						placeholder="Select organization..."
						searchPlaceholder="Search organizations..."
						emptyMessage="No organization found"
					/>
					<p className="text-xs text-muted-foreground">
						Leave empty to create without an organization
					</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="description">Description</Label>
					<Textarea
						id="description"
						name="description"
						placeholder="Event description in markdown..."
						className="min-h-32"
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="eventType">Event Type</Label>
						<Select name="eventType" defaultValue="hackathon">
							<SelectTrigger id="eventType">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="hackathon">Hackathon</SelectItem>
								<SelectItem value="conference">Conference</SelectItem>
								<SelectItem value="workshop">Workshop</SelectItem>
								<SelectItem value="bootcamp">Bootcamp</SelectItem>
								<SelectItem value="meetup">Meetup</SelectItem>
								<SelectItem value="olympiad">Olympiad</SelectItem>
								<SelectItem value="competition">Competition</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="format">Format</Label>
						<Select name="format" defaultValue="hybrid">
							<SelectTrigger id="format">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="virtual">Virtual</SelectItem>
								<SelectItem value="in-person">In-person</SelectItem>
								<SelectItem value="hybrid">Hybrid</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			<div className="rounded-lg border bg-card p-6 space-y-6">
				<h2 className="text-lg font-semibold">Date & Location</h2>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="startDate">Start Date</Label>
						<Input id="startDate" name="startDate" type="datetime-local" />
					</div>

					<div className="space-y-2">
						<Label htmlFor="endDate">End Date</Label>
						<Input id="endDate" name="endDate" type="datetime-local" />
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="country">Country</Label>
						<Input
							id="country"
							name="country"
							placeholder="Peru"
							defaultValue="Peru"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="department">Department</Label>
						<SearchableSelect
							options={PERU_DEPARTMENTS}
							value={department}
							onValueChange={setDepartment}
							placeholder="Select department..."
							searchPlaceholder="Search..."
							emptyMessage="Not found"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="city">City</Label>
						<Input id="city" name="city" placeholder="Lima" />
					</div>

					<div className="space-y-2">
						<Label htmlFor="venue">Venue</Label>
						<Input id="venue" name="venue" placeholder="UTEC Campus" />
					</div>
				</div>
			</div>

			<div className="rounded-lg border bg-card p-6 space-y-6">
				<h2 className="text-lg font-semibold">Links & Media</h2>

				<div className="space-y-2">
					<Label htmlFor="websiteUrl">Website URL</Label>
					<Input
						id="websiteUrl"
						name="websiteUrl"
						type="url"
						placeholder="https://..."
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="registrationUrl">Registration URL</Label>
					<Input
						id="registrationUrl"
						name="registrationUrl"
						type="url"
						placeholder="https://..."
					/>
				</div>

				<div className="space-y-2">
					<Label>Event Banner</Label>
					<ImageUpload
						value={eventImageUrl}
						onChange={setEventImageUrl}
						onRemove={() => setEventImageUrl("")}
						endpoint="imageUploader"
						aspectRatio="3/1"
					/>
				</div>
			</div>

			<div className="rounded-lg border bg-card p-6 space-y-6">
				<h2 className="text-lg font-semibold">Additional Details</h2>

				<div className="space-y-2">
					<Label htmlFor="skillLevel">Skill Level</Label>
					<Select name="skillLevel" defaultValue="all">
						<SelectTrigger id="skillLevel">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="beginner">Beginner</SelectItem>
							<SelectItem value="intermediate">Intermediate</SelectItem>
							<SelectItem value="advanced">Advanced</SelectItem>
							<SelectItem value="all">All Levels</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="prizePool">Prize Pool</Label>
						<Input
							id="prizePool"
							name="prizePool"
							type="number"
							placeholder="10000"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="prizeCurrency">Currency</Label>
						<Select name="prizeCurrency" defaultValue="USD">
							<SelectTrigger id="prizeCurrency">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="USD">USD ($)</SelectItem>
								<SelectItem value="PEN">PEN (S/)</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4">
					<p className="text-sm text-red-600">{error}</p>
				</div>
			)}

			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="ghost"
					onClick={() => router.back()}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Creating...
						</>
					) : (
						<>
							<Sparkles className="h-4 w-4" />
							Create Event
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
