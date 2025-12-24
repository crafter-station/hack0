import type { Metadata } from "next";
import { GiftLandingClient } from "@/components/gift/gift-landing-client";

export const metadata: Metadata = {
	title: "Recibe tu regalo",
	description:
		"Una tarjeta de Navidad personalizada, creada con IA solo para ti. Un pequeño regalo de hack0.dev.",
};

export default function GiftLandingPage() {
	return <GiftLandingClient />;
}
