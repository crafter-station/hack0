"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { toPng } from "html-to-image";
import { Check, Download, Loader2, Share2, Trophy } from "lucide-react";
import { type RefObject, useState } from "react";
import { AchievementUnlocked } from "@/components/achievements/achievement-unlocked";
import { LinkedinLogo } from "@/components/logos/linkedin";
import { Button } from "@/components/ui/button";

const GIFT_COLORS = {
	text: "#fafafa",
	border: "rgba(250, 250, 250, 0.2)",
	bgHover: "rgba(250, 250, 250, 0.1)",
};

interface GiftActionsProps {
	token: string;
	generatedImageUrl: string;
	message: string;
	recipientName?: string;
	builderId?: number;
	badgeRef?: RefObject<HTMLDivElement | null>;
}

interface UnlockedAchievement {
	id: string;
	name: string;
	description: string;
	rarity: string;
	points: number;
	iconUrl?: string;
}

export function GiftActions({
	token,
	generatedImageUrl,
	message,
	builderId,
	badgeRef,
}: GiftActionsProps) {
	const { isSignedIn } = useAuth();
	const [isSaving, setIsSaving] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [copied, setCopied] = useState(false);
	const [unlockedAchievement, setUnlockedAchievement] =
		useState<UnlockedAchievement | null>(null);

	const formattedId = builderId
		? `#${builderId.toString().padStart(4, "0")}`
		: "";

	const handleDownload = async () => {
		try {
			if (badgeRef?.current) {
				const dataUrl = await toPng(badgeRef.current, {
					backgroundColor: "#0a0a0f",
					pixelRatio: 2,
					cacheBust: true,
				});
				const a = document.createElement("a");
				a.href = dataUrl;
				a.download = `hack0-badge-2025${formattedId ? `-${formattedId.replace("#", "")}` : ""}.png`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			} else {
				const response = await fetch(generatedImageUrl);
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `hack0-badge-2025${formattedId ? `-${formattedId.replace("#", "")}` : ""}.png`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
			}
		} catch (error) {
			console.error("Download failed:", error);
		}
	};

	const handleShareLinkedIn = () => {
		const shareUrl = `${window.location.origin}/gift/card/${token}`;
		const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
		window.open(linkedInUrl, "_blank", "noopener,noreferrer");
	};

	const handleShare = async () => {
		const shareUrl = `${window.location.origin}/gift/card/${token}`;
		const shareText = `HACK0.DEV 2025 ${formattedId} - "${message}"`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: `HACK0.DEV 2025 ${formattedId}`,
					text: shareText,
					url: shareUrl,
				});
			} catch (error) {
				if ((error as Error).name !== "AbortError") {
					await copyToClipboard(shareUrl);
				}
			}
		} else {
			await copyToClipboard(shareUrl);
		}
	};

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("Copy failed:", error);
		}
	};

	const handleSave = async () => {
		if (!isSignedIn) return;

		setIsSaving(true);
		try {
			const response = await fetch("/api/gift/save", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token }),
			});

			if (!response.ok) throw new Error("Failed to save");

			const data = await response.json();
			setIsSaved(true);

			if (data.achievementUnlocked) {
				setUnlockedAchievement(data.achievementUnlocked);
			}
		} catch (error) {
			console.error("Save failed:", error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<>
			<div className="flex flex-col gap-2 w-full">
				<Button
					onClick={handleShareLinkedIn}
					className="w-full gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white"
				>
					<LinkedinLogo className="h-4 w-4" mode="dark" />
					Compartir en LinkedIn
				</Button>

				<div className="grid grid-cols-2 gap-2">
					<Button
						onClick={handleDownload}
						variant="outline"
						className="gap-2"
						style={{
							borderColor: GIFT_COLORS.border,
							color: GIFT_COLORS.text,
							backgroundColor: "transparent",
						}}
					>
						<Download className="h-4 w-4" />
						Descargar
					</Button>

					<Button
						onClick={handleShare}
						variant="outline"
						className="gap-2"
						style={{
							borderColor: GIFT_COLORS.border,
							color: GIFT_COLORS.text,
							backgroundColor: "transparent",
						}}
					>
						{copied ? (
							<>
								<Check className="h-4 w-4" />
								Copiado
							</>
						) : (
							<>
								<Share2 className="h-4 w-4" />
								Compartir
							</>
						)}
					</Button>
				</div>

				{isSignedIn ? (
					<Button
						onClick={handleSave}
						disabled={isSaving || isSaved}
						className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
					>
						{isSaving ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Guardando...
							</>
						) : isSaved ? (
							<>
								<Check className="h-4 w-4" />
								Badge guardado
							</>
						) : (
							<>
								<Trophy className="h-4 w-4" />
								Guardar badge
							</>
						)}
					</Button>
				) : (
					<SignInButton mode="modal">
						<Button className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
							<Trophy className="h-4 w-4" />
							Guardar badge
						</Button>
					</SignInButton>
				)}
			</div>

			{unlockedAchievement && (
				<AchievementUnlocked
					achievement={unlockedAchievement}
					onClose={() => setUnlockedAchievement(null)}
				/>
			)}
		</>
	);
}
