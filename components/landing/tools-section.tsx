const tools = [
	{ name: "Cursor", url: "https://cursor.com" },
	{ name: "Lovable", url: "https://lovable.dev" },
	{ name: "Supabase", url: "https://supabase.com" },
	{ name: "n8n", url: "https://n8n.io" },
	{ name: "Vercel", url: "https://vercel.com" },
	{ name: "Neon", url: "https://neon.tech" },
];

export function ToolsSection() {
	return (
		<section className="border-t py-12">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<p className="text-xs text-muted-foreground uppercase tracking-wide text-center mb-6">
					Herramientas que usamos y recomendamos
				</p>
				<div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
					{tools.map((tool) => (
						<a
							key={tool.name}
							href={tool.url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							{tool.name}
						</a>
					))}
				</div>
			</div>
		</section>
	);
}
