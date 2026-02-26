import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
	// Image uploader for logos, banners, etc.
	imageUploader: f({
		"image/jpeg": { maxFileSize: "4MB", maxFileCount: 1 },
		"image/png": { maxFileSize: "4MB", maxFileCount: 1 },
		"image/webp": { maxFileSize: "4MB", maxFileCount: 1 },
		"image/gif": { maxFileSize: "4MB", maxFileCount: 1 },
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
		"image/jpeg": { maxFileSize: "8MB", maxFileCount: 1 },
		"image/png": { maxFileSize: "8MB", maxFileCount: 1 },
		"image/webp": { maxFileSize: "8MB", maxFileCount: 1 },
		"image/gif": { maxFileSize: "8MB", maxFileCount: 1 },
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

	// Submission file uploader - images, PDFs, videos
	submissionFileUploader: f({
		"image/jpeg": { maxFileSize: "8MB", maxFileCount: 5 },
		"image/png": { maxFileSize: "8MB", maxFileCount: 5 },
		"image/webp": { maxFileSize: "8MB", maxFileCount: 5 },
		"image/gif": { maxFileSize: "8MB", maxFileCount: 5 },
		"application/pdf": { maxFileSize: "16MB", maxFileCount: 3 },
		"video/mp4": { maxFileSize: "64MB", maxFileCount: 1 },
		"video/webm": { maxFileSize: "64MB", maxFileCount: 1 },
	})
		.middleware(async () => {
			const { userId } = await auth();

			if (!userId) throw new UploadThingError("No autorizado");

			return { userId };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log(
				"Submission file upload complete for userId:",
				metadata.userId,
			);
			console.log("file url", file.ufsUrl);

			return { uploadedBy: metadata.userId, url: file.ufsUrl };
		}),

	// Public gift photo uploader - NO AUTH REQUIRED for Christmas gift cards
	giftPhotoUploader: f({
		"image/jpeg": { maxFileSize: "4MB", maxFileCount: 1 },
		"image/png": { maxFileSize: "4MB", maxFileCount: 1 },
		"image/webp": { maxFileSize: "4MB", maxFileCount: 1 },
	})
		.middleware(async () => {
			return { uploadedAt: new Date().toISOString() };
		})
		.onUploadComplete(async ({ file }) => {
			console.log("Gift photo upload complete:", file.ufsUrl);
			return { url: file.ufsUrl };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
