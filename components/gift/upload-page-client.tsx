"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredGiftToken } from "@/components/gift/gift-landing-client";
import { PhotoUpload } from "@/components/gift/photo-upload";

export function UploadPageClient() {
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
				<div className="w-full max-w-md mx-auto space-y-6">
					<div className="text-center space-y-1">
						<h1
							className="text-2xl font-bold tracking-tight"
							style={{ color: "#fafafa" }}
						>
							Sube tu foto
						</h1>
						<p
							className="text-sm"
							style={{ color: "rgba(250, 250, 250, 0.6)" }}
						>
							La transformaremos en una ilustración navideña única
						</p>
					</div>

					<PhotoUpload />
				</div>
			</div>
		</div>
	);
}
