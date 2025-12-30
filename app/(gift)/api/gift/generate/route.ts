export async function POST() {
	return Response.json(
		{
			error: "Service temporarily disabled",
			message: "Gift card generation is temporarily unavailable",
		},
		{ status: 503 },
	);
}
