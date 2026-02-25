"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { useMounted } from "@/hooks/use-mounted";

const faqs = [
	{
		question: "¿Qué es hack0.dev?",
		answer:
			"hack0.dev es la plataforma de eventos tech para Latinoamérica. Centralizamos hackathones, conferencias, workshops, meetups y más de toda la región. Nuestro objetivo es mapear el ecosistema tech de LATAM y dar visibilidad a las comunidades que organizan eventos.",
	},
	{
		question: "¿Cómo puedo enterarme de nuevos eventos?",
		answer:
			"Puedes explorar el calendario de eventos en cualquier momento. También estamos trabajando en notificaciones por email para que recibas alertas de eventos que te interesen.",
	},
	{
		question: "¿Puedo publicar mis eventos?",
		answer:
			"¡Sí! Si tienes una comunidad u organizas eventos tech, puedes crear tu organización gratis y publicar todos tus eventos. No hay límites ni costos. Queremos que todas las comunidades tech tengan visibilidad.",
	},
	{
		question: "¿En qué países está hack0?",
		answer:
			"hack0 cubre toda Latinoamérica. Actualmente tenemos eventos activos en Perú, Guatemala, Colombia y más países se suman cada semana. El proyecto es open source — si quieres impulsar la iniciativa en tu país, eres bienvenido a colaborar.",
	},
	{
		question: "¿Cuál es el objetivo a largo plazo?",
		answer:
			"Queremos mapear completamente el ecosistema tech de LATAM: comunidades, eventos, organizadores y builders. Puedes ver nuestras prioridades en el roadmap.",
	},
	{
		question: "¿Cómo puedo colaborar?",
		answer:
			"Si organizas eventos, publícalos en la plataforma. Si conoces comunidades tech que no están aquí, invítalas a crear su perfil. También puedes contribuir al código en GitHub ya que es un proyecto open source.",
	},
];

export function FAQSection() {
	const mounted = useMounted();

	return (
		<section className="border-t py-12 md:py-16">
			<div className="mx-auto max-w-screen-xl px-4 lg:px-8">
				<div className="max-w-2xl mx-auto">
					<div className="text-center mb-8">
						<h2 className="text-xl font-semibold">Preguntas frecuentes</h2>
						<p className="text-sm text-muted-foreground mt-1">
							Todo lo que necesitas saber sobre hack0.dev
						</p>
					</div>

					{mounted ? (
						<Accordion type="single" collapsible className="w-full">
							{faqs.map((faq, index) => (
								<AccordionItem key={index} value={`item-${index}`}>
									<AccordionTrigger className="text-left text-sm">
										{faq.question}
									</AccordionTrigger>
									<AccordionContent className="text-sm text-muted-foreground">
										{faq.answer}
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					) : (
						<div className="w-full space-y-0">
							{faqs.map((faq, index) => (
								<div key={index} className="border-b py-4">
									<button
										type="button"
										className="flex w-full items-center justify-between text-left text-sm font-medium"
									>
										{faq.question}
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
