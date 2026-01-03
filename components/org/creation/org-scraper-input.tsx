"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { AlertCircle, Check, Globe, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { startOrgScraper } from "@/lib/actions/organizations";

interface OrgScraperInputProps {
	organizationId: string;
	websiteUrl: string;
	onWebsiteUrlChange: (url: string) => void;
	onDataScraped?: (data: {
		name?: string;
		description?: string;
		type?: string;
		email?: string;
		logoUrl?: string;
	}) => void;
}

export function OrgScraperInput({
	organizationId,
	websiteUrl,
	onWebsiteUrlChange,
	onDataScraped,
}: OrgScraperInputProps) {
	const [runId, setRunId] = useState<string | null>(null);
	const [isScraping, setIsScraping] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { run, error: runError } = useRealtimeRun(runId || "", {
		enabled: !!runId,
	});

	const status = run?.metadata?.status as string | undefined;
	const extractedData = run?.metadata?.extractedData as
		| {
				name?: string;
				description?: string;
				type?: string;
				email?: string;
		  }
		| undefined;
	const logoUrl = run?.metadata?.logoUrl as string | undefined;

	useEffect(() => {
		if (run?.isCompleted && extractedData && onDataScraped) {
			onDataScraped({
				name: extractedData.name,
				description: extractedData.description,
				type: extractedData.type,
				email: extractedData.email,
				logoUrl,
			});
		}
	}, [run?.isCompleted, extractedData, logoUrl, onDataScraped]);

	useEffect(() => {
		if (runError) {
			setError("Error scraping website");
			setIsScraping(false);
		}
	}, [runError]);

	const handleScrape = async () => {
		if (!websiteUrl) {
			setError("Please enter a website URL");
			return;
		}

		setIsScraping(true);
		setError(null);

		try {
			const result = await startOrgScraper(organizationId, websiteUrl);
			setRunId(result.runId);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to start scraper");
			setIsScraping(false);
		}
	};

	const canScrape = websiteUrl && !isScraping && !run?.isExecuting;

	return (
		<Field>
			<FieldLabel htmlFor="websiteUrl">Sitio web</FieldLabel>
			<div className="flex gap-2">
				<div className="flex-1">
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<Globe className="h-4 w-4" />
						</InputGroupAddon>
						<InputGroupInput
							id="websiteUrl"
							name="websiteUrl"
							type="url"
							placeholder="https://..."
							value={websiteUrl}
							onChange={(e) => onWebsiteUrlChange(e.target.value)}
							disabled={isScraping || run?.isExecuting}
						/>
					</InputGroup>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleScrape}
					disabled={!canScrape}
					className="shrink-0"
				>
					{isScraping || run?.isExecuting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
							{status === "extracting" && "Extrayendo..."}
							{status === "uploading_logo" && "Subiendo logo..."}
							{status === "updating_org" && "Actualizando..."}
							{!status && "Scrapeando..."}
						</>
					) : run?.isCompleted ? (
						<>
							<Check className="h-4 w-4 mr-2 text-emerald-500" />
							Listo
						</>
					) : (
						<>
							<Sparkles className="h-4 w-4 mr-2" />
							Auto-rellenar
						</>
					)}
				</Button>
			</div>
			<FieldDescription>
				{run?.isCompleted
					? "Datos extraídos exitosamente. Los campos se rellenaron automáticamente."
					: "Opcional. Puedes auto-rellenar los datos desde tu sitio web."}
			</FieldDescription>
			{error && (
				<div className="flex items-center gap-2 text-sm text-red-500 mt-2">
					<AlertCircle className="h-4 w-4" />
					{error}
				</div>
			)}
		</Field>
	);
}
