"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GiftBox from "@/components/gift-box";

const GIFT_TOKEN_KEY = "hack0_gift_token";

export function getStoredGiftToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(GIFT_TOKEN_KEY);
}

export function setStoredGiftToken(token: string): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(GIFT_TOKEN_KEY, token);
}

export function GiftLandingClient() {
	const router = useRouter();
	const [isChecking, setIsChecking] = useState(true);

	useEffect(() => {
		const existingToken = getStoredGiftToken();
		if (existingToken) {
			router.replace(`/gift/card/${existingToken}`);
		} else {
			setIsChecking(false);
		}
	}, [router]);

	if (isChecking) {
		return (
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="flex flex-col items-center justify-center min-h-[70vh] py-12">
					<div className="animate-pulse text-muted-foreground">Cargando...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
			<div className="flex flex-col items-center justify-center min-h-[70vh] py-12">
				<div className="relative w-full h-[50vh] min-h-[300px]">
					<GiftBox />
				</div>
			</div>
		</div>
	);
}
