import { NextResponse } from "next/server";
import packageJson from "@/package.json";

export async function GET() {
	const bunVersion = Reflect.get(process.versions, "bun");
	const runtime =
		typeof bunVersion === "string"
			? `bun ${bunVersion}`
			: `node ${process.version}`;

	return NextResponse.json({
		status: "ok",
		version: packageJson.version,
		uptime: process.uptime(),
		runtime,
		timestamp: new Date().toISOString(),
	});
}
