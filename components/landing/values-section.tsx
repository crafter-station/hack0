import { Code, Eye, HandHeart, Users } from "lucide-react";

const values = [
	{
		icon: Code,
		title: "Indie Hacker Mindset",
		description:
			"Crear con poco, escalar con ingenio. Construimos productos, no slides.",
	},
	{
		icon: HandHeart,
		title: "Gratitud Radical",
		description:
			"La comunidad es un privilegio. Reconocemos a quienes nos ayudan.",
	},
	{
		icon: Eye,
		title: "Build in Public",
		description:
			"Mostrar > decir. Compartimos progreso, errores y aprendizajes.",
	},
	{
		icon: Users,
		title: "Colaboración Real",
		description:
			"Sin gurús, sin gatekeeping. Colaboración genuina entre pares.",
	},
];

export function ValuesSection() {
	return (
		<section className="border-t py-12 md:py-16">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="text-center mb-8">
					<p className="text-xs text-muted-foreground uppercase tracking-wide">
						Valores
					</p>
					<h2 className="text-xl font-semibold mt-2">Cómo construimos</h2>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{values.map((value) => (
						<div key={value.title} className="rounded-2xl border p-5">
							<value.icon className="h-5 w-5 text-muted-foreground mb-3" />
							<h3 className="text-sm font-medium">{value.title}</h3>
							<p className="text-xs text-muted-foreground mt-1">
								{value.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
