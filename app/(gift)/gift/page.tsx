import { ArrowRight, Gift, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "Recibe tu regalo",
	description:
		"Una tarjeta de Navidad personalizada, creada con IA solo para ti. Un pequeño regalo de hack0.dev.",
};

export default function GiftLandingPage() {
	return (
		<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
			<div className="flex flex-col items-center justify-center min-h-[70vh] text-center py-12">
				<div className="max-w-lg mx-auto space-y-8">
					<div className="relative inline-block">
						<div className="absolute -inset-8 bg-gradient-to-br from-red-500/20 via-transparent to-emerald-500/20 blur-3xl" />
						<div className="relative text-8xl">🎁</div>
					</div>

					<div className="space-y-3">
						<h1
							className="text-3xl md:text-4xl font-bold tracking-tight"
							style={{ color: "#fafafa" }}
						>
							Tenemos un pequeño regalo para ti
						</h1>
						<p
							className="text-base"
							style={{ color: "rgba(250, 250, 250, 0.6)" }}
						>
							Una tarjeta de Navidad personalizada, creada con IA solo para ti.
						</p>
					</div>

					<div className="flex flex-col items-center gap-3">
						<Link href="/gift/upload">
							<Button
								size="lg"
								className="h-10 px-6 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
							>
								<Gift className="h-4 w-4" />
								Abrir mi regalo
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>

						<p
							className="text-xs flex items-center gap-1.5"
							style={{ color: "rgba(250, 250, 250, 0.4)" }}
						>
							<Sparkles className="h-3 w-3 text-amber-400" />
							No tomará más de un minuto
						</p>
					</div>

					<div
						className="pt-6"
						style={{ borderTop: "1px solid rgba(250, 250, 250, 0.1)" }}
					>
						<p
							className="text-xs mb-3"
							style={{ color: "rgba(250, 250, 250, 0.4)" }}
						>
							¿Cómo funciona?
						</p>
						<div
							className="flex flex-wrap items-center justify-center gap-3 text-xs"
							style={{ color: "rgba(250, 250, 250, 0.6)" }}
						>
							<div className="flex items-center gap-1.5">
								<span
									className="w-5 h-5 flex items-center justify-center text-[10px] font-mono font-medium"
									style={{
										border: "1px solid rgba(250, 250, 250, 0.2)",
										color: "rgba(250, 250, 250, 0.8)",
									}}
								>
									1
								</span>
								<span>Sube tu foto</span>
							</div>
							<ArrowRight
								className="h-3 w-3"
								style={{ color: "rgba(250, 250, 250, 0.3)" }}
							/>
							<div className="flex items-center gap-1.5">
								<span
									className="w-5 h-5 flex items-center justify-center text-[10px] font-mono font-medium"
									style={{
										border: "1px solid rgba(250, 250, 250, 0.2)",
										color: "rgba(250, 250, 250, 0.8)",
									}}
								>
									2
								</span>
								<span>La IA la transforma</span>
							</div>
							<ArrowRight
								className="h-3 w-3"
								style={{ color: "rgba(250, 250, 250, 0.3)" }}
							/>
							<div className="flex items-center gap-1.5">
								<span
									className="w-5 h-5 flex items-center justify-center text-[10px] font-mono font-medium"
									style={{
										border: "1px solid rgba(250, 250, 250, 0.2)",
										color: "rgba(250, 250, 250, 0.8)",
									}}
								>
									3
								</span>
								<span>Recibe tu tarjeta</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
