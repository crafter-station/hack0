"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface SaveEventButtonProps {
	eventId: string;
	eventName: string;
	initialSaved?: boolean;
}

export function SaveEventButton({ eventId, eventName, initialSaved = false }: SaveEventButtonProps) {
	const [isSaved, setIsSaved] = useState(initialSaved);
	const [isAnimating, setIsAnimating] = useState(false);

	const handleToggleSave = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		setIsAnimating(true);
		const newState = !isSaved;
		setIsSaved(newState);

		// TODO: Add actual save/unsave logic to database
		// For now, just store in localStorage
		const savedEvents = JSON.parse(localStorage.getItem("savedEvents") || "[]");
		if (newState) {
			savedEvents.push(eventId);
			toast.success("Evento guardado");
		} else {
			const index = savedEvents.indexOf(eventId);
			if (index > -1) savedEvents.splice(index, 1);
			toast.success("Evento removido");
		}
		localStorage.setItem("savedEvents", JSON.stringify(savedEvents));

		setTimeout(() => setIsAnimating(false), 300);
	};

	return (
		<motion.button
			onClick={handleToggleSave}
			className={`
				p-2 rounded-full transition-colors
				${isSaved ? "bg-pink-50 dark:bg-pink-950/30" : "bg-muted/50 hover:bg-muted"}
			`}
			whileTap={{ scale: 0.9 }}
		>
			<motion.div
				animate={isAnimating ? { scale: [1, 1.3, 1] } : {}}
				transition={{ duration: 0.3 }}
			>
				<Heart
					className={`h-4 w-4 transition-colors ${
						isSaved
							? "fill-pink-500 stroke-pink-500"
							: "stroke-muted-foreground"
					}`}
				/>
			</motion.div>
		</motion.button>
	);
}
