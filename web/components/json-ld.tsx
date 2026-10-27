export function JsonLd({ data }: { data: unknown }) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: serialized structured data, `<` escaped
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
