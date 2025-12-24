import type { Metadata } from "next";
import GiftBox from "@/components/gift-box";

export const metadata: Metadata = {
	title: "Recibe tu regalo",
	description:
		"Una tarjeta de Navidad personalizada, creada con IA solo para ti. Un pequeño regalo de hack0.dev.",
};

export default function GiftLandingPage() {
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
