import { db } from "../lib/db";
import { events } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const updates: Record<string, string> = {
  "desafio-hackathon-ai-griculture-2024": `Hackathon de **Inteligencia Artificial aplicada a la Agricultura** en Latinoamérica.

## Objetivo

Desarrollar soluciones innovadoras usando IA para transformar la agricultura en la región.

## Modalidad

- Participación **100% virtual**
- Equipos de toda Latinoamérica
- Enfoque en problemas reales del sector agrícola`,

  "ia-hackathon-peru-2025": `Hackathon de **24 horas** enfocado en Inteligencia Artificial.

## ¿Qué esperar?

- Desarrolla soluciones innovadoras con IA
- Mentoría de expertos de la industria
- Networking con developers y data scientists

## Sede

Universidad Cayetano Heredia, Lima

## Dirigido a

Desarrolladores, científicos de datos y entusiastas de la IA.`,

  "ethereum-lima-2025": `Construye el futuro de **Web3** en Perú.

## Sobre el evento

Ethereum Lima reúne a desarrolladores blockchain para crear dApps, protocolos DeFi y soluciones Web3 innovadoras.

## ¿Qué puedes construir?

- Smart Contracts
- dApps descentralizadas
- Protocolos DeFi
- NFTs y tokens
- Soluciones Layer 2

## Comunidad

Parte de la comunidad global de Ethereum.`,

  "minedu-hackathon-peru-2025": `Hackathon del **Ministerio de Educación del Perú** para revolucionar la educación.

## Participantes

204 estudiantes de todo el país.

## Enfoque

- Inteligencia Artificial aplicada a la educación
- Robótica educativa
- Innovación STEAM

## Objetivo

Desarrollar soluciones tecnológicas que mejoren la experiencia educativa en Perú.`,

  "hackathon-lima-segura": `Hackathon de **tecnología cívica** organizado por la Municipalidad de Lima.

## Retos

- Seguridad ciudadana
- Movilidad urbana
- Iniciativas de ciudad inteligente

## Organiza

Municipalidad Metropolitana de Lima`,

  "techstars-startup-weekend-lima-2025": `**54 horas** para lanzar tu startup.

## Dinámica

1. **Viernes**: Presenta tu idea
2. **Sábado**: Forma equipo y construye tu MVP
3. **Domingo**: Presenta a inversionistas

## Ideal para

- Emprendedores aspirantes
- Hackers primerizos
- Creativos con ideas

## Metodología

Techstars Startup Weekend - validada a nivel mundial.`,

  "peru-fintech-forum-hackathon-2025": `Hackathon enfocado en **innovación financiera**.

## Parte de

Perú Fintech Forum 2025

## Tracks

- Soluciones financieras innovadoras
- Track especial para **mujeres en fintech**

## Objetivo

Desarrollar productos y servicios que transformen el sector financiero peruano.`,

  "codeon-2025": `Conferencia tech y mini-hackathon para **estudiantes universitarios**.

## ¿Qué incluye?

- Workshops prácticos
- Charlas de expertos
- Desafíos de programación

## Sede

Universidad Tecnológica del Perú (UTP), Lima`,

  "ayni-hackathon-2024": `Hackathon nacional en el marco de **APEC Perú**.

## Sedes

- Lima
- Arequipa
- Trujillo

## Enfoque

Innovación y colaboración tecnológica a nivel nacional.

## Organiza

Universidad Peruana de Ciencias Aplicadas (UPC)`,

  "hackathon-social-internacional-2024": `Hackathon organizado por **Casa Rusa**.

## Metodología

Design Sprint para diseñar propuestas innovadoras.

## Ganador

**Hi!Chik** de Arequipa - Plataforma de participación ciudadana juvenil.`,

  "peru-hub-digital-hackathon-2025": `Evento que conecta a la comunidad académica con la **alta tecnología**.

## Actividades

- Hackathon
- Torneos de robótica
- Networking con +50 empresas

## Temáticas

- Inteligencia Artificial
- Data Center
- Vinculación Empresa-Universidad

## Dirigido a

Estudiantes, técnicos y docentes.`,

  "hackathon-economia-circular-produce-2025": `Hackathon de la **I Cumbre Produce Circular**.

## Objetivo

Desarrollar soluciones sostenibles para la industria manufacturera y comercio interno.

## Apoyo internacional

- Embajada de Alemania
- GIZ (Cooperación Alemana)

## Enfoque

Economía circular y sostenibilidad.`,

  "justihack-peru-2025": `Hackathon para fortalecer la **transparencia judicial**.

## Objetivo

Proponer soluciones innovadoras que mejoren la imparcialidad y confianza en el sistema judicial.

## Proyecto destacado

**Semáforo Judicial** - Plataforma de IA desarrollada por la Universidad del Pacífico (2do lugar).`,

  "energ-ia-hackathon-ulima-2025": `Hackathon nacional de **innovación energética**.

## Dirigido a

- Estudiantes de pregrado
- Jóvenes profesionales

## Mentores de

- AWS
- Microsoft
- Edulink
- Oracle

## Enfoque

IA y herramientas tecnológicas para revolucionar el sector energético.`,

  "hackathon-chiclayo-servicios-publicos-2025": `Primera Hackathon de la **Municipalidad Provincial de Chiclayo**.

## Objetivo

Desarrollar soluciones innovadoras para la prestación de servicios públicos.

## Co-organiza

Colegio de Ingenieros del Perú - Consejo Departamental Lambayeque`,

  "nasa-space-apps-huanuco-2025": `Primera edición oficial del **NASA Space Apps Challenge** en Huánuco.

## Proyectos desarrollados

- Propuestas de seguridad espacial
- Plataformas de realidad virtual educativa
- Sistemas de pronóstico meteorológico con IA

## Datos

Uso de datos abiertos de la NASA.`,

  "conasein-hackathon-cientifica-2025": `**III Congreso Nacional de Semilleros de Investigación**

## Actividades

- Proyectos de investigación
- Pósters científicos
- Talleres y ponencias
- Hackathon Científica

## Participantes

Estudiantes de universidades públicas y privadas de todo el Perú.`,

  "nasa-space-apps-peru-2025": `El **hackathon internacional más grande del mundo** llega a Perú.

## Sedes en Perú

- Ayacucho
- Arequipa
- Cusco
- Huancayo
- Ica
- Lima

## Desafíos

Resolver problemas reales usando datos abiertos de la NASA sobre la Tierra y el espacio.`,

  "escuela-computacion-cuantica-hackathon-2025": `Programa intensivo de **7 días** sobre Computación Cuántica.

## Incluye

- Clases teóricas
- Conferencias magistrales
- Laboratorios prácticos
- Hackathon

## Celebración oficial

Año Internacional de Ciencia y Tecnología Cuántica (IYQ)

## Costo

**100% gratuito** con certificado de participación.`,

  "hacklife-pmi-2023": `Hackathon de **innovación social** organizado por PMI Perú.

## Caring Us Edition

- Explora soluciones creativas
- Aprende de expertos en la industria
- Conecta con mentes brillantes

## Incluye

- Talleres de ideación
- Construcción de MVP
- Mentoría especializada`,

  "eneisoft-hackathon-2025": `El evento donde las **ideas se convierten en soluciones reales**.

## ¿Para quién?

Si te apasiona la tecnología, el software y la innovación, esta es tu oportunidad.

## Edición

XV edición del Hackathon ENEISOFT

## Objetivo

Crear, conectar y competir con los mejores talentos del país.`,

  "jakumbre-2025-dia-3-sociales": `**Día 3: Área de Sociales** - JAKUMBRE 2025

## Enfoque

El rol de la comunidad emprendedora y el ecosistema de innovación.

## Contenido

- Nuevas tendencias en emprendimiento
- Aprendizajes y experiencias
- Conferencia magistral sobre innovación social`,

  "jakumbre-2025-dia-2-ingenierias": `**Día 2: Área de Ingenierías** - JAKUMBRE 2025

## Enfoque

Cómo convertir soluciones técnicas en empresas reales desde la ingeniería.

## Contenido

- Tendencias tecnológicas
- Retos de la industria
- Casos de éxito
- Intercambio entre especialistas`,

  "jakumbre-2025-dia-1-biomedicas": `**Día 1: Área de Biomédicas** - JAKUMBRE 2025

## Enfoque

Innovación en salud y biotecnología.

## Contenido

- Perspectivas sobre innovación en salud
- Panel de experiencias con startups de biotecnología
- Networking con profesionales del sector`,

  "jakumbre-2025": `**Tres días** para aprender, conectar y transformar.

## Sobre JAKUMBRE

IV Cumbre de Emprendimiento e Innovación Universitaria.

## Dinámica

Cada día en una sede distinta, con enfoque específico:

- **Día 1**: Área de Biomédicas
- **Día 2**: Área de Ingenierías
- **Día 3**: Área de Sociales

## Temáticas

Innovación, tecnología y emprendimiento transformando Arequipa y el Perú.`,

  "contecih-2025-videojuegos": `**Eje: Desarrollo de Videojuegos** - CONTECIH 2025

## Contenido

- Conferencias especializadas
- Talleres prácticos
- Game development y engines
- Diseño de juegos
- Industria gaming

## Modalidad

100% Virtual`,

  "contecih-2025-ciberseguridad": `**Eje: Ciberseguridad** - CONTECIH 2025

## Contenido

- Conferencias especializadas
- Talleres prácticos
- Seguridad informática
- Ethical hacking
- Protección de sistemas

## Sede

UTEC – Barranco, Lima`,

  "contecih-2025-inteligencia-artificial": `**Eje: Inteligencia Artificial** - CONTECIH 2025

## Contenido

- Conferencias especializadas
- Talleres prácticos
- Machine Learning
- Deep Learning
- LLMs y aplicaciones de IA

## Sede

UTP Lima Centro`,

  "contecih-2025-congreso-tecnologia-innovacion": `**V Congreso de Tecnología, Innovación y Habilidades para el Futuro**

## Organizan

- IEEE Computer Society UTP
- IEEE Computer Society UTEC

## Ejes temáticos

- Ciberseguridad
- Desarrollo de Videojuegos
- Inteligencia Artificial

## Incluye

- Conferencias especializadas
- Talleres prácticos
- Certificado de participación (opcional)

## Costo

**Evento gratuito**

## Dirigido a

Estudiantes de ingeniería, docentes, investigadores, profesionales TI y comunidad IEEE.`,

  "casual-code-brew-chatting-open-source-vibe-coding-ai": `Meetup casual para **builders** en Lima.

## Temas

- Open Source
- Ecosistema TypeScript
- Vibe Coding
- Apps con IA

## Hosts

- **Cristian Correa** - Founder de Kebo
- **Railly Hugo** - Co-founder de Crafter Station
- **Anthony Cueva** - Co-founder de Crafter Station

## Formato

Café relajado, máximo 10 personas. Trae tus ideas y tu laptop para demos rápidas.`
};

async function main() {
  console.log("Actualizando descripciones...\n");

  for (const [slug, newDescription] of Object.entries(updates)) {
    try {
      const result = await db
        .update(events)
        .set({ description: newDescription })
        .where(eq(events.slug, slug));

      console.log(`✓ ${slug}`);
    } catch (error) {
      console.error(`✗ ${slug}:`, error);
    }
  }

  console.log("\n¡Listo! Descripciones actualizadas.");
}

main();
