"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

type CountdownTarget = {
	type: "registration" | "start" | "end";
	label: string;
	date: Date;
};

interface EventCountdownProps {
	event: {
		startDate: Date | null;
		endDate: Date | null;
		registrationDeadline: Date | null;
		status: "upcoming" | "open" | "ongoing" | "ended";
	};
	variant?: "hero" | "compact";
}

function getCountdownTarget(
	event: EventCountdownProps["event"],
): CountdownTarget | null {
	const now = new Date();

	if (
		event.registrationDeadline &&
		event.registrationDeadline > now &&
		(event.status === "upcoming" || event.status === "open")
	) {
		return {
			type: "registration",
			label: "Cierra inscripción",
			date: event.registrationDeadline,
		};
	}

	if (event.startDate && event.startDate > now) {
		return {
			type: "start",
			label: "Empieza",
			date: event.startDate,
		};
	}

	if (event.status === "ongoing" && event.endDate && event.endDate > now) {
		return {
			type: "end",
			label: "Termina",
			date: event.endDate,
		};
	}

	return null;
}

function formatTimeRemaining(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) {
		return `${days}d ${hours % 24}h`;
	}
	if (hours > 0) {
		return `${hours}h ${minutes % 60}m`;
	}
	if (minutes > 0) {
		return `${minutes}m`;
	}
	return `${seconds}s`;
}

function getUrgencyColor(ms: number, type: CountdownTarget["type"]): string {
	const hours = ms / (1000 * 60 * 60);

	if (hours <= 72) {
		return type === "end"
			? "text-emerald-500 bg-emerald-500/10"
			: "text-red-500 bg-red-500/10";
	}
	if (hours <= 168) {
		return "text-amber-500 bg-amber-500/10";
	}
	return "text-blue-500 bg-blue-500/10";
}

export function EventCountdown({
	event,
	variant = "hero",
}: EventCountdownProps) {
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
	const [target, setTarget] = useState<CountdownTarget | null>(null);

	useEffect(() => {
		const countdownTarget = getCountdownTarget(event);
		setTarget(countdownTarget);

		if (!countdownTarget) return;

		const updateCountdown = () => {
			const now = new Date();
			const remaining = countdownTarget.date.getTime() - now.getTime();
			setTimeRemaining(remaining > 0 ? remaining : null);
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 60000);

		return () => clearInterval(interval);
	}, [event]);

	if (!target || timeRemaining === null || timeRemaining <= 0) {
		return null;
	}

	const urgencyColor = getUrgencyColor(timeRemaining, target.type);

	if (variant === "compact") {
		return (
			<div
				className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${urgencyColor}`}
			>
				<Clock className="h-3 w-3" />
				{target.label} en {formatTimeRemaining(timeRemaining)}
			</div>
		);
	}

	return (
		<div
			className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${urgencyColor}`}
		>
			<Clock className="h-4 w-4" />
			<span>
				{target.label} en <strong>{formatTimeRemaining(timeRemaining)}</strong>
			</span>
		</div>
	);
}
