# Websearch Scraper — Query List

~58 queries organizadas en 5 categorías. Usar `getDateContext()` y año dinámico al construir queries.

---

## Categoría A: Geográficas LATAM (15 queries)

```
label: mexico
query: "hackathon México {year} convocatoria abierta inscripción Ciudad de México Guadalajara Monterrey universidades empresas tecnología"

label: brasil
query: "maratona hackathon desafio inovação Brasil {year} inscrições abertas São Paulo Rio de Janeiro Belo Horizonte startups tecnologia"

label: argentina-chile
query: "hackathon Argentina Chile {year} inscripción abierta Buenos Aires Córdoba Santiago fintech innovación tecnología"

label: colombia
query: "hackathon Colombia {year} Bogotá Medellín Cali convocatoria abierta innovación tecnología universidades empresas"

label: peru-ecuador
query: "hackathon Perú Ecuador {year} Lima Quito Guayaquil Arequipa convocatoria abierta innovación tecnología"

label: centroamerica
query: "hackathon Centroamérica Guatemala Costa Rica Panamá El Salvador Honduras {year} tecnología innovación inscripción"

label: caribe
query: "hackathon Caribe República Dominicana Puerto Rico Cuba {year} tecnología innovación convocatoria"

label: bolivia-paraguay-uruguay
query: "hackathon Bolivia Paraguay Uruguay {year} La Paz Asunción Montevideo innovación tecnología convocatoria abierta"

label: venezuela
query: "hackathon Venezuela {year} Caracas Maracaibo tecnología innovación convocatoria abierta programación"

label: latam-virtual
query: "hackathon virtual online América Latina {year} inscripción abierta latinoamérica premio tecnología equipos remotos"

label: latam-universitario
query: "hackathon universitario América Latina {year} estudiantes programación tecnología universidades competencia equipos"

label: latam-gobierno
query: "hackathon gobierno innovación pública América Latina {year} datos abiertos ciudadano tecnología cívica ministerio"

label: latam-fintech
query: "hackathon fintech banca digital pagos América Latina {year} startup financiero innovación convocatoria"

label: latam-web3-crypto
query: "hackathon blockchain web3 criptomonedas América Latina {year} DeFi NFT desarrollo descentralizado"

label: latam-impacto-social
query: "hackathon impacto social sostenibilidad clima ODS América Latina {year} ONG fundación organización internacional"
```

---

## Categoría A2: Ciudades LATAM — hubs tech de alta densidad (13 queries)

Queries de nivel ciudad para capturar hackathones locales que las queries regionales pueden omitir.

```
label: bogota-medellin
query: "hackathon Bogotá Medellín Cali Colombia {year} inscripción abierta programación innovación tecnología convocatoria"

label: cdmx-gdl-mty
query: "hackathon Ciudad de México CDMX Guadalajara Monterrey {year} convocatoria abierta tecnología innovación startup"

label: lima-arequipa
query: "hackathon Lima Arequipa Cusco Perú {year} convocatoria abierta tecnología innovación programación"

label: sao-paulo-rio
query: "hackathon maratona São Paulo Rio de Janeiro Belo Horizonte Brasil {year} inscrições abertas tecnologia inovação"

label: buenos-aires-cordoba
query: "hackathon Buenos Aires Córdoba Rosario Argentina {year} inscripción abierta tecnología innovación startup"

label: santiago-valparaiso
query: "hackathon Santiago Valparaíso Concepción Chile {year} inscripción abierta tecnología innovación"

label: quito-guayaquil
query: "hackathon Quito Guayaquil Cuenca Ecuador {year} convocatoria abierta tecnología innovación programación"

label: caracas
query: "hackathon Caracas Maracaibo Valencia Venezuela {year} convocatoria tecnología innovación programación"

label: lapaz-cochabamba
query: "hackathon La Paz Cochabamba Santa Cruz Bolivia {year} convocatoria abierta tecnología innovación"

label: montevideo
query: "hackathon Montevideo Uruguay {year} convocatoria abierta tecnología innovación startup fintech"

label: asuncion
query: "hackathon Asunción Paraguay {year} convocatoria abierta tecnología innovación programación"

label: san-jose-ciudad-panama
query: "hackathon San José Costa Rica Ciudad de Panamá Panamá {year} convocatoria abierta tecnología innovación"

label: santo-domingo
query: "hackathon Santo Domingo República Dominicana San Juan Puerto Rico {year} tecnología innovación convocatoria"
```

---

## Categoría B: Temáticas (10 queries)

```
label: ai-ml-latam
query: "hackathon inteligencia artificial machine learning deep learning América Latina {year} convocatoria abierta modelos LLM"

label: salud-biotech-latam
query: "hackathon salud digital biotecnología telemedicina healthtech América Latina {year} hospital clínica innovación médica"

label: agritech-latam
query: "hackathon agritech agricultura tecnología alimentos campo América Latina {year} innovación agropecuaria convocatoria"

label: educacion-latam
query: "hackathon educación edtech aprendizaje tecnología América Latina {year} universidades estudiantes convocatoria"

label: smart-cities-latam
query: "hackathon smart city ciudad inteligente movilidad urbanismo tecnología América Latina {year} municipio"

label: ciberseguridad-latam
query: "hackathon ciberseguridad seguridad informática CTF América Latina {year} ethical hacking convocatoria"

label: open-source-latam
query: "hackathon open source código abierto contribución América Latina {year} GitHub comunidad desarrolladores"

label: hardware-iot-latam
query: "hackathon hardware IoT robótica electrónica América Latina {year} Arduino Raspberry makers convocatoria"

label: climate-energy-latam
query: "hackathon energía renovable cambio climático medio ambiente América Latina {year} sostenibilidad convocatoria"

label: legaltech-govtech-latam
query: "hackathon legaltech govtech justicia tecnología gobierno digital América Latina {year} datos abiertos convocatoria"
```

---

## Categoría C: Empresas Tech Reconocidas (15 queries)

Usar `scopeHint: "global"` para estas queries — son hackathones globales online abiertos a LATAM.

```
label: microsoft-hackathon
query: "Microsoft hackathon challenge 2025 2026 open registration global online Azure AI developer"

label: google-hackathon
query: "Google hackathon challenge 2025 2026 open registration global developers Cloud AI Gemini"

label: openai-hackathon
query: "OpenAI hackathon GPT API challenge 2025 2026 developers open registration global"

label: vercel-hackathon
query: "Vercel hackathon challenge 2025 2026 Next.js frontend developers open registration global"

label: meta-hackathon
query: "Meta hackathon challenge Llama AI developer 2025 2026 open registration global"

label: aws-hackathon
query: "AWS Amazon hackathon challenge 2025 2026 cloud builders open registration global Latin America"

label: anthropic-hackathon
query: "Anthropic Claude hackathon challenge 2025 2026 AI developers open registration global"

label: huggingface-hackathon
query: "Hugging Face hackathon challenge 2025 2026 open source AI models developers registration"

label: github-hackathon
query: "GitHub hackathon challenge Copilot 2025 2026 developers open source registration global"

label: stripe-hackathon
query: "Stripe hackathon payments fintech challenge 2025 2026 developers open registration"

label: cloudflare-hackathon
query: "Cloudflare hackathon Workers challenge 2025 2026 developers open registration global"

label: nvidia-hackathon
query: "NVIDIA hackathon GPU AI deep learning challenge 2025 2026 open registration global"

label: ibm-hackathon
query: "IBM hackathon watsonx AI challenge 2025 2026 open registration global developers"

label: salesforce-hackathon
query: "Salesforce Trailblazer hackathon challenge 2025 2026 developers open registration global"

label: blockchain-foundations
query: "Ethereum Solana Polkadot Cosmos hackathon grant challenge 2025 2026 open registration global developers"
```

---

## Categoría D: Globales Abiertas a LATAM (5 queries)

```
label: global-social-impact
query: "online hackathon social impact climate SDGs 2025 2026 open registration international teams Latin America eligible"

label: global-ai-open
query: "global AI hackathon challenge 2025 2026 open registration international participants no country restriction"

label: devpost-featured
query: "devpost.com hackathon 2025 2026 online open registration prize money Latin America participants"

label: luma-hackathon
query: "lu.ma hackathon event 2025 2026 online registration open international developers"

label: united-nations-hackathon
query: "United Nations UNDP World Bank hackathon challenge 2025 2026 open registration global developing countries"
```

---

## Variables dinámicas

Al construir queries, reemplaza:
- `{year}` → año actual: `new Date().getFullYear()`
- Añadir también año siguiente cuando sea relevante

> **Nota:** No prefixes las queries con "Hoy es {mes} {año}." — los motores de búsqueda ignoran ese texto. Los años `{year}` y `{year+1}` en la query son suficientes para filtrar resultados frescos.
