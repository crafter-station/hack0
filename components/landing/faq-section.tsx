"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
	{
		question: "Que es hack0.dev?",
		answer:
			"hack0.dev es la plataforma de descubrimiento de eventos tech en Peru. Centralizamos hackathones, conferencias, workshops, meetups y mas para que no te pierdas ninguna oportunidad de aprender y conectar.",
	},
	{
		question: "Como puedo participar?",
		answer:
			"Suscribete con tu email para recibir notificaciones de nuevos eventos. Tambien puedes explorar el calendario de eventos y registrarte directamente en los que te interesen.",
	},
	{
		question: "Puedo publicar mis eventos?",
		answer:
			"Si, crea una cuenta gratuita y podras publicar tus eventos en la plataforma. No hay limites ni costos. Solo necesitas configurar tu organizacion y empezar a publicar.",
	},
	{
		question: "Que es la Hacker House?",
		answer:
			"La Hacker House es un espacio fisico donde builders pueden trabajar juntos, hacer pair programming, y participar en sesiones semanales. Es el nucleo intensivo de la comunidad.",
	},
	{
		question: "hack0 es solo para Lima?",
		answer:
			"No, queremos activar builders en todo Peru. Tenemos embajadores en diferentes ciudades y apoyamos eventos en cualquier region del pais. La comunidad es distribuida.",
	},
];

export function FAQSection() {
	return (
		<section className="border-t py-12 md:py-16">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="max-w-2xl mx-auto">
					<div className="text-center mb-8">
						<p className="text-xs text-muted-foreground uppercase tracking-wide">
							FAQ
						</p>
						<h2 className="text-xl font-semibold mt-2">Preguntas frecuentes</h2>
					</div>

					<Accordion type="single" collapsible className="w-full">
						{faqs.map((faq, index) => (
							<AccordionItem key={index} value={`item-${index}`}>
								<AccordionTrigger className="text-left">
									{faq.question}
								</AccordionTrigger>
								<AccordionContent className="text-muted-foreground">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</div>
		</section>
	);
}
