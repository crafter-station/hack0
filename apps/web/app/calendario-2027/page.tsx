import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { Shell } from "@/components/shell";
import { hubEvents } from "@/lib/catalog";
import { faqJsonLd } from "@/lib/faq";
import { FLAGSHIP_2027, FLAGSHIP_2027_UPDATED, flagshipFaq, flagshipItemListJsonLd } from "@/lib/flagship-2027";
import { LUMA, SITE } from "@/lib/site";

export const revalidate = 3600;

const TITLE = "Eventos tech en LATAM 2026–2027: calendario de conferencias, IA y hackathones";
const DESCRIPTION =
  "Calendario actualizado de los principales eventos tech, conferencias de IA, encuentros de startups y hackathones en Latinoamérica para 2026 y 2027, con fechas, ciudades y enlaces oficiales.";

export const metadata: Metadata = {
  title: `${TITLE} | hack0`,
  description: DESCRIPTION,
  alternates: { canonical: "/calendario-2027" },
};

export default async function Calendario2027() {
  const catalog = await hubEvents(null, null);
  const liveUpcoming = catalog?.upcoming ?? [];
  const faq = flagshipFaq(liveUpcoming.length);
  const countries = [...new Set(FLAGSHIP_2027.map((e) => e.country))];

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "hack0", item: SITE },
      { "@type": "ListItem", position: 2, name: "Eventos", item: `${SITE}/eventos` },
      { "@type": "ListItem", position: 3, name: "Calendario 2026–2027", item: `${SITE}/calendario-2027` },
    ],
  };

  return (
    <Shell>
      <JsonLd data={flagshipItemListJsonLd(FLAGSHIP_2027)} />
      <JsonLd data={faqJsonLd(faq)} />
      <JsonLd data={breadcrumbs} />

      <div className="hero-copy hub">
        <p className="crumbs">
          <Link href="/">hack0</Link> / <Link href="/eventos">eventos</Link>
        </p>
        <h1>Eventos tech en LATAM 2026–2027</h1>
        <p>
          Calendario cronológico de las principales conferencias de tecnología, inteligencia artificial, startups y desarrollo de software
          en Latinoamérica ({countries.join(", ")}), actualizado el {FLAGSHIP_2027_UPDATED}.
        </p>
        <p>
          Si buscas meetups, workshops y hackathones de esta semana, mira también los{" "}
          <Link href="/eventos">{liveUpcoming.length} eventos próximos del calendario vivo</Link>.
        </p>
      </div>

      <section>
        <div className="label">
          <span>conferencias flagship 2026–2027</span>
        </div>
        <div className="cal-table-wrap">
          <table className="cal-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>País y ciudad</th>
                <th>Fecha</th>
                <th>Foco</th>
              </tr>
            </thead>
            <tbody>
              {FLAGSHIP_2027.map((e) => (
                <tr key={e.slug}>
                  <td>
                    <a href={e.url} target="_blank" rel="noopener noreferrer">
                      {e.name}
                    </a>
                  </td>
                  <td>
                    {e.city}, {e.country}
                  </td>
                  <td className="cal-date">{e.dateLabel}</td>
                  <td>{e.focus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="label">
          <span>agenda por ciudad y tema en hack0</span>
        </div>
        <div className="prose">
          <p>Además de las conferencias anuales, hack0 agrega automáticamente eventos de comunidades locales en toda Latinoamérica:</p>
          <p className="chips">
            <Link href="/eventos">Todos los eventos próximos</Link> <Link href="/tema/ia">Eventos de IA</Link>{" "}
            <Link href="/tema/hackathon">Hackathones</Link> <Link href="/ciudad/lima">Lima</Link>{" "}
            <Link href="/ciudad/buenos-aires">Buenos Aires</Link> <Link href="/ciudad/bogota">Bogotá</Link>{" "}
            <Link href="/ciudad/ciudad-de-mexico">Ciudad de México</Link> <Link href="/ciudad/sao-paulo">São Paulo</Link>{" "}
            <Link href="/ciudad/santiago">Santiago</Link>
          </p>
          <p>
            ¿Organizas una conferencia o hackathon en 2027? Súmalo gratis en el <a href={LUMA}>calendario de hack0 en Luma</a>.
          </p>
        </div>
      </section>

      <section>
        <div className="label">
          <span>preguntas frecuentes</span>
        </div>
        <div className="faq-list">
          {faq.map((item) => (
            <details key={item.q} open>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </Shell>
  );
}
