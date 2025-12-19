"use client";

import { useUser } from "@clerk/nextjs";
import { Bell, Check, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type SubscriptionStatus =
	| "checking"
	| "idle"
	| "loading"
	| "pending"
	| "subscribed"
	| "error";

export function SubscribeForm() {
	const { isSignedIn, isLoaded, user } = useUser();
	const [status, setStatus] = useState<SubscriptionStatus>("checking");
	const [_error, setError] = useState("");

	const email = user?.primaryEmailAddress?.emailAddress;

	// Check subscription status on mount
	useEffect(() => {
		if (!isLoaded) return;
		if (!email) {
			setStatus("idle");
			return;
		}

		const checkStatus = async () => {
			try {
				const response = await fetch(
					`/api/subscribe/status?email=${encodeURIComponent(email)}`,
				);
				if (response.ok) {
					const data = await response.json();
					if (data.isVerified && data.isActive) {
						setStatus("subscribed");
					} else if (data.exists && !data.isVerified) {
						setStatus("pending");
					} else {
						setStatus("idle");
					}
				} else {
					setStatus("idle");
				}
			} catch {
				setStatus("idle");
			}
		};

		checkStatus();
	}, [email, isLoaded]);

	const handleSubscribe = async () => {
		if (!email) return;

		setStatus("loading");
		setError("");

		try {
			const response = await fetch("/api/subscribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (!response.ok) {
				setStatus("error");
				setError(data.error || "Error al suscribirse");
				return;
			}

			// Si ya estaba suscrito
			if (data.alreadySubscribed) {
				setStatus("subscribed");
			} else {
				setStatus("pending");
			}
		} catch {
			setStatus("error");
			setError("Error de conexión");
		}
	};

	if (!isLoaded || status === "checking") {
		return (
			<button
				disabled
				className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background opacity-50"
			>
				<div className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
			</button>
		);
	}

	if (!isSignedIn) {
		return (
			<Link
				href="/sign-in?redirect_url=/"
				className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
			>
				<Bell className="h-3 w-3" />
				Suscribirse
			</Link>
		);
	}

	if (status === "subscribed") {
		return (
			<span className="inline-flex h-8 items-center gap-1.5 text-xs text-muted-foreground">
				<Check className="h-3 w-3 text-emerald-500" />
				Suscrito
			</span>
		);
	}

	if (status === "pending") {
		return (
			<span className="inline-flex h-8 items-center gap-1.5 text-xs text-muted-foreground">
				<Mail className="h-3 w-3" />
				Confirma email
			</span>
		);
	}

	return (
		<button
			onClick={handleSubscribe}
			disabled={status === "loading"}
			className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
		>
			{status === "loading" ? (
				<div className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
			) : (
				<Bell className="h-3 w-3" />
			)}
			Suscribirse
		</button>
	);
}
