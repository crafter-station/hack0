import { NextResponse } from "next/server";
import packageJson from "@/package.json";

export async function GET() {
	const runtime = typeof Bun !== "undefined" ? `bun ${Bun.version}` : `node ${process.version}`;

	return NextResponse.json({
		status: "ok",
		version: packageJson.version,
		uptime: process.uptime(),
		runtime,
		timestamp: new Date().toISOString(),
	});
}
