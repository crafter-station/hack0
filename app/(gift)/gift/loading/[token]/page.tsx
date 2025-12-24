import type { Metadata } from "next";
import { GiftLoading } from "@/components/gift/gift-loading";

export const metadata: Metadata = {
	title: "Preparando tu regalo...",
	description: "Estamos creando tu tarjeta de Navidad personalizada con IA.",
};

interface LoadingPageProps {
	params: Promise<{ token: string }>;
}

export default async function GiftLoadingPage({ params }: LoadingPageProps) {
	const { token } = await params;

	return (
		<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
			<div className="flex flex-col items-center justify-center min-h-[70vh] py-12">
				<GiftLoading token={token} />
			</div>
		</div>
	);
}
