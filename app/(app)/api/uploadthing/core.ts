import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
	// Image uploader for logos, banners, etc.
	imageUploader: f({
		image: {
			maxFileSize: "4MB",
			maxFileCount: 1,
		},
	})
		.middleware(async () => {
			const { userId } = await auth();

			if (!userId) throw new UploadThingError("No autorizado");

			return { userId };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log("Upload complete for userId:", metadata.userId);
			console.log("file url", file.ufsUrl);

			return { uploadedBy: metadata.userId, url: file.ufsUrl };
		}),

	// Banner uploader with larger size for event banners
	bannerUploader: f({
		image: {
			maxFileSize: "8MB",
			maxFileCount: 1,
		},
	})
		.middleware(async () => {
			const { userId } = await auth();

			if (!userId) throw new UploadThingError("No autorizado");

			return { userId };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log("Banner upload complete for userId:", metadata.userId);
			console.log("file url", file.ufsUrl);

			return { uploadedBy: metadata.userId, url: file.ufsUrl };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
