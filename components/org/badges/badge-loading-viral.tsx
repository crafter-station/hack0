"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const PHASES = [
	{ time: 0, message: "Iniciando generación" },
	{ time: 5, message: "Analizando tu foto" },
	{ time: 12, message: "Aplicando estilo de la comunidad" },
	{ time: 20, message: "Generando fondo personalizado" },
	{ time: 30, message: "Refinando detalles" },
	{ time: 40, message: "Finalizando tu badge" },
];

const ESTIMATED_DURATION = 50;

interface BadgeLoadingViralProps {
	token: string;
	shortCode: string;
	communityName: string;
	communityLogo: string | null;
}

export function BadgeLoadingViral({
	token,
	shortCode,
	communityName,
	communityLogo,
}: BadgeLoadingViralProps) {
	const router = useRouter();
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const [isCompleting, setIsCompleting] = useState(false);

	const { data } = useQuery({
		queryKey: ["badge-status", token],
		queryFn: async () => {
			const res = await fetch(`/api/badge/status/${token}`);
			if (!res.ok) throw new Error("Failed to fetch status");
			return res.json();
		},
		refetchInterval: 2000,
	});

	useEffect(() => {
		if (data?.status === "completed") {
			setIsCompleting(true);
			setTimeout(() => {
				router.push(`/b/${shortCode}/${token}`);
			}, 600);
		}
	}, [data?.status, router, token, shortCode]);

	useEffect(() => {
		const interval = setInterval(() => {
			setElapsedSeconds((prev) => prev + 1);
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	const currentPhase = PHASES.reduce((acc, phase, index) => {
		if (elapsedSeconds >= phase.time) return index;
		return acc;
	}, 0);

	const currentMessage = PHASES[currentPhase];
	const showLongWaitMessage = elapsedSeconds >= 35;

	const progress = isCompleting
		? 100
		: Math.min((elapsedSeconds / ESTIMATED_DURATION) * 95, 95);

	if (data?.status === "failed") {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
				<div className="p-4 rounded-lg border bg-destructive/10 border-destructive/20">
					<Award className="h-10 w-10 text-destructive" />
				</div>
				<div>
					<h2 className="text-lg font-semibold mb-1">
						Error al generar el badge
					</h2>
					<p className="text-sm text-muted-foreground">
						{data?.errorMessage || "Algo salió mal. Intentémoslo de nuevo."}
					</p>
				</div>
				<Button
					onClick={() => router.push(`/b/${shortCode}`)}
					variant="outline"
				>
					Intentar de nuevo
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 px-4">
			<div className="flex items-center gap-3">
				{communityLogo && (
					<Image
						src={communityLogo}
						alt={communityName}
						width={40}
						height={40}
						className="rounded-lg"
					/>
				)}
				<span className="text-lg font-semibold">{communityName}</span>
			</div>

			<motion.div
				className="relative"
				animate={{
					scale: [1, 1.02, 1],
				}}
				transition={{
					duration: 2,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
				}}
			>
				<div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 blur-2xl rounded-full" />
				<div className="relative p-6 rounded-xl border bg-card/80 backdrop-blur-sm">
					<Loader2 className="h-12 w-12 animate-spin text-primary" />
				</div>
			</motion.div>

			<div className="text-center space-y-3 min-h-[60px]">
				<div className="h-6 overflow-hidden">
					<AnimatePresence mode="wait">
						<motion.p
							key={currentPhase}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.4 }}
							className="text-base font-medium"
						>
							{currentMessage.message}...
						</motion.p>
					</AnimatePresence>
				</div>

				{showLongWaitMessage && (
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-xs text-muted-foreground"
					>
						La IA está trabajando en los detalles finales
					</motion.p>
				)}
			</div>

			<div className="w-full max-w-[240px] space-y-2">
				<div className="h-2 rounded-full overflow-hidden bg-muted border">
					<motion.div
						className="h-full rounded-full bg-primary"
						initial={{ width: 0 }}
						animate={{ width: `${progress}%` }}
						transition={{
							duration: isCompleting ? 0.4 : 0.8,
							ease: "easeOut",
						}}
					/>
				</div>
				<div className="flex justify-between text-[10px] font-mono text-muted-foreground">
					<span>{Math.round(progress)}%</span>
					<span>~{Math.max(0, ESTIMATED_DURATION - elapsedSeconds)}s</span>
				</div>
			</div>
		</div>
	);
}
