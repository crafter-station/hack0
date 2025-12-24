import type { Metadata } from "next";
import { PhotoUpload } from "@/components/gift/photo-upload";

export const metadata: Metadata = {
	title: "Sube tu foto",
	description:
		"Sube tu foto y la transformaremos en una ilustración navideña única con IA.",
};

export default function GiftUploadPage() {
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
