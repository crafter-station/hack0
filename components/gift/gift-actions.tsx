"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { Check, Download, Loader2, Share2, Trophy } from "lucide-react";
import { useState } from "react";
import { AchievementUnlocked } from "@/components/achievements/achievement-unlocked";
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
}

interface UnlockedAchievement {
	id: string;
	name: string;
	description: string;
	rarity: string;
	points: number;
	iconUrl?: string;
}

export function GiftActions({ token, generatedImageUrl }: GiftActionsProps) {
	const { isSignedIn } = useAuth();
	const [isSaving, setIsSaving] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [copied, setCopied] = useState(false);
	const [unlockedAchievement, setUnlockedAchievement] =
		useState<UnlockedAchievement | null>(null);

	const handleDownload = async () => {
		try {
			const response = await fetch(generatedImageUrl);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `hack0-christmas-2025-${token}.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Download failed:", error);
		}
	};

	const handleShare = async () => {
		const shareUrl = `${window.location.origin}/gift/card/${token}`;
		const shareText = "Un pequeño regalo por Navidad 🎄";

		if (navigator.share) {
			try {
				await navigator.share({
					title: "Mi Tarjeta de Navidad - hack0.dev",
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
								Desbloqueando...
							</>
						) : isSaved ? (
							<>
								<Check className="h-4 w-4" />
								Logro desbloqueado
							</>
						) : (
							<>
								<Trophy className="h-4 w-4" />
								Desbloquear logro
							</>
						)}
					</Button>
				) : (
					<SignInButton mode="modal">
						<Button className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
							<Trophy className="h-4 w-4" />
							Desbloquear logro
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
