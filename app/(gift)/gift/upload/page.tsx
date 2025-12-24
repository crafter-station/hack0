import type { Metadata } from "next";
import { UploadPageClient } from "@/components/gift/upload-page-client";

export const metadata: Metadata = {
	title: "Sube tu foto",
	description:
		"Sube tu foto y la transformaremos en una ilustración navideña única con IA.",
};

export default function GiftUploadPage() {
	return <UploadPageClient />;
}
