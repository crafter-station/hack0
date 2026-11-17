type Term = {
  term: string;
  /** The rest of the sentence that starts with the term, and its measured example when there is one. */
  text: string;
  /** Slugs of the pieces the example was measured on. */
  pieces: string[];
  /** Station on the word bench where the term can be operated. */
  bench?: string;
};

/** The workshop's vocabulary: three layers, each term in one line. */
export const VOCABULARY: { id: string; title: string; groups: { title: string | null; terms: Term[] }[] }[] = [
  {
    id: "se-ve",
    title: "Cómo se ve",
    groups: [
      {
        title: "Composición y tipografía",
        terms: [
          {
            term: "Jerarquía",
            text: "es el orden en que el ojo lee una pantalla. En la marca de hack0 el color se reparte por área, con ink en 85% y el acento en 3%.",
            pieces: [],
          },
          {
            term: "Escala tipográfica",
            text: "es el conjunto de tamaños que usa una interfaz. El sitio de Nubank usa 156, 112, 96, 72 y 34 px para títulos.",
            pieces: ["brand-nubank-system"],
          },
          {
            term: "Tracking",
            text: "es el espacio entre letras. El titular de 156 px de Nubank lleva un tracking de -3.4 px.",
            pieces: ["brand-nubank-system"],
            bench: "tracking",
          },
          {
            term: "Leading",
            text: "es el alto de línea. La landing corregida usa 0.95 y los títulos de Nubank 0.94.",
            pieces: ["brand-nubank-system", "landing"],
          },
          {
            term: "Grid",
            text: "es la retícula a la que se alinea el contenido. Nubank deja un gutter de 88 px y un contenido de 1264 px en un desktop de 1440.",
            pieces: ["brand-nubank-system"],
          },
          {
            term: "Ritmo vertical",
            text: "es la regularidad del espacio entre bloques. Nubank lo construye sobre una base de 4 px.",
            pieces: ["brand-nubank-system"],
          },
          {
            term: "Contraste",
            text: "es la diferencia de luminancia entre un texto y su fondo. En Liquid Glass el label negro pasa de 4.29 a 9.65 cuando tiene la pill detrás.",
            pieces: ["look-liquid-glass"],
          },
          {
            term: "Densidad",
            text: "es cuánta información entra en una pantalla.",
            pieces: [],
          },
          {
            term: "Cortes ópticos",
            text: "son versiones de una misma familia dibujadas para tamaños distintos. Nu Sans Display va de 34 px para arriba y Nu Sans Text de 22 px para abajo.",
            pieces: ["brand-nubank-system"],
          },
          {
            term: "Números tabulares",
            text: "son cifras con el mismo ancho, que se alinean en columnas. La página de marca de hack0 los usa en su tabla de eventos.",
            pieces: [],
          },
        ],
      },
      {
        title: "Superficie",
        terms: [
          {
            term: "Blur",
            text: "es desenfocar lo que está detrás de un elemento. El de Liquid Glass ronda los 3 pt.",
            pieces: ["look-liquid-glass"],
          },
          {
            term: "Glassmorphism",
            text: "es blur, tint y borde, con el fondo borroso pero en su lugar. Suele usar un blur de 20 a 40 px.",
            pieces: [],
          },
          {
            term: "Refracción",
            text: "es desplazar el fondo como lo haría un lente. En Liquid Glass el borde mueve el fondo 3.1 pt en vertical y 7.1 pt en horizontal.",
            pieces: ["look-liquid-glass"],
          },
          {
            term: "Displacement map",
            text: "es la imagen que le dice a un filtro cuánto mover cada pixel. Nuestra recreación de Liquid Glass genera uno y lo aplica con un filtro SVG.",
            pieces: ["look-liquid-glass"],
          },
          {
            term: "Rim especular",
            text: "es la línea de luz en el borde de un vidrio, con brillo distinto según el ángulo. En el toggle de Apple mide 1 pt.",
            pieces: ["look-liquid-glass"],
          },
          {
            term: "Tint",
            text: "es el velo de color sobre el material. Liquid Glass usa blanco al 40% en la barra de tabs y al 20% en el thumb.",
            pieces: ["look-liquid-glass"],
          },
          {
            term: "Sombras en capas",
            text: "son dos o más sombras apiladas. Liquid Glass usa una ambient pareja y otra desplazada 3 px hacia abajo.",
            pieces: ["look-liquid-glass"],
          },
          {
            term: "Grain",
            text: "es ruido fino sobre un relleno. En Liquid Glass no encontramos ninguno, el relleno es plano. Lit Room lo lleva en su pase final.",
            pieces: ["look-liquid-glass", "look-lit-room"],
          },
          {
            term: "Gradiente o ruido",
            text: "es la pregunta de con qué está pintado un relleno. La respuesta en Liquid Glass fue ninguno de los dos.",
            pieces: ["look-liquid-glass"],
          },
          {
            term: "Low-key",
            text: "es una imagen mayormente oscura. El film de Nothing tiene un brillo promedio de 0.095.",
            pieces: ["video-nothing-film"],
          },
          {
            term: "Rim light",
            text: "es una luz que dibuja solo el borde del objeto. El film de Nothing ilumina así su producto.",
            pieces: ["video-nothing-film"],
          },
        ],
      },
      {
        title: "Luz",
        terms: [
          {
            term: "Luz de área",
            text: "es una luz que sale de una superficie y no de un punto. La pantalla de Lit Room son 32, en una grilla de 8 × 4, y toman su color de la página.",
            pieces: ["look-lit-room"],
          },
          {
            term: "Rebote",
            text: "es la luz que llega a una superficie después de tocar otra. En Lit Room la pantalla no mira a la pared, y la pared se ilumina con lo que rebota del escritorio.",
            pieces: ["look-lit-room"],
          },
          {
            term: "Sombra de contacto",
            text: "es la línea oscura donde un objeto toca la superficie. En Lit Room mide 2 mm y va junto a una caída ancha que crece con la altura del objeto.",
            pieces: ["look-lit-room"],
          },
          {
            term: "Curva de tono",
            text: "es cómo se comprimen las luces altas al pasar a la pantalla. ACES les quita saturación, y la curva de Lit Room la devuelve y lleva la saturación del charco de 63 a 73.",
            pieces: ["look-lit-room"],
          },
          {
            term: "Luz de relleno",
            text: "es una luz baja que levanta las sombras. En Lit Room vale 0.06 y toma el 75% de su color de la pantalla, porque en neutro se leía como luz de día.",
            pieces: ["look-lit-room"],
          },
          {
            term: "Distancia focal",
            text: "decide cuánto ángulo abarca el lente. Lit Room pasó de 58 a 42 grados para que los audífonos del primer plano dejaran de verse hinchados.",
            pieces: ["look-lit-room"],
          },
        ],
      },
      {
        title: "Marca",
        terms: [
          {
            term: "Paleta con roles",
            text: "es una paleta donde cada color tiene un trabajo. En Nubank el morado #8D0DE3 es logo, botón primario, titular y link.",
            pieces: ["brand-nubank-system"],
          },
          {
            term: "Token fantasma",
            text: "es un valor que sigue declarado y que ningún elemento usa. En nubank.com.br es el morado #820AD1.",
            pieces: ["brand-nubank-system"],
          },
          {
            term: "Acento garantizado",
            text: "es un color de marca que viaja en una pieza fija. Nubank lleva su morado en el contenedor del logo y hack0 lleva su naranja en el slash del cero.",
            pieces: ["brand-nubank-system"],
          },
          {
            term: "Sistema y excepción",
            text: "separa lo que se repite en todas las páginas de lo que aparece una sola vez. El logo de Nubank sin contenedor en el footer es una excepción.",
            pieces: ["brand-nubank-system"],
          },
        ],
      },
    ],
  },
  {
    id: "se-mueve",
    title: "Cómo se mueve",
    groups: [
      {
        title: "Interfaz",
        terms: [
          {
            term: "Easing",
            text: "es la curva de velocidad de una animación. El thumb de Liquid Glass crece con ease-out y se encoge con ease-in.",
            pieces: ["look-liquid-glass"],
            bench: "easing",
          },
          {
            term: "Spring",
            text: "es una animación física definida por stiffness y damping en lugar de una duración. Las letras del morph de Family usan 800 y 56.",
            pieces: ["motion-family-morph"],
          },
          {
            term: "Duration",
            text: "es cuánto dura una animación. En un spring es el tiempo hasta asentarse, 230 ms en las letras de Family.",
            pieces: ["motion-family-morph"],
          },
          {
            term: "Overshoot",
            text: "es cuánto se pasa del destino antes de volver. La bandeja de Family se pasa 0.3% o menos, así que se siente rápida sin rebotar.",
            pieces: ["motion-family-morph"],
          },
          {
            term: "Stagger",
            text: "es el desfase entre animaciones relacionadas para que cada una se lea. En Family la bandeja espera los 230 ms del morph.",
            pieces: ["motion-family-morph"],
            bench: "stagger",
          },
          {
            term: "Layout animation",
            text: "es animar el cambio de posición o de tamaño de un elemento entre dos layouts. El indicador de las tabs viaja así.",
            pieces: ["tabs"],
          },
          {
            term: "Shared element",
            text: "es un elemento que persiste entre dos estados en vez de reemplazarse. Las letras C, o, n, i pasan de Continue a Confirm.",
            pieces: ["motion-family-morph"],
          },
          {
            term: "Scroll-driven",
            text: "es una animación que avanza con el scroll. En landonorris.com el scroll mueve la cámara 3D.",
            pieces: ["made-lando-stack"],
          },
          {
            term: "Scrubbed",
            text: "es una animación cuyo progreso está atado a la posición del scroll. Así va el 3D de landonorris.com.",
            pieces: ["made-lando-stack"],
          },
          {
            term: "Pinned",
            text: "es una sección que se queda fija mientras el scroll avanza la animación. landonorris.com no pinea, nuestro mecanismo rehecho sí.",
            pieces: ["made-lando-stack"],
          },
          {
            term: "Smooth scroll",
            text: "es suavizar el scroll para que llegue frenando. landonorris.com usa Lenis con lerp 0.1.",
            pieces: ["made-lando-stack"],
          },
        ],
      },
      {
        title: "Video",
        terms: [
          {
            term: "Cortes por minuto",
            text: "mide el ritmo de una edición. El film de Nothing tiene 31.9.",
            pieces: ["video-nothing-film"],
          },
          {
            term: "Shot mediano",
            text: "es el largo mediano de los planos. En el film de Nothing es 1.68 s.",
            pieces: ["video-nothing-film"],
          },
          {
            term: "Hard cut",
            text: "es un corte seco, sin transición. Casi todos los cortes del film de Nothing lo son.",
            pieces: ["video-nothing-film"],
          },
          {
            term: "Punch-in",
            text: "es un corte al mismo eje de cámara, más cerca. Nuestro film cierra con uno sobre el comando.",
            pieces: ["video-nothing-film"],
          },
          {
            term: "Oclusión",
            text: "es cuando la cámara entra en un objeto hasta tapar el cuadro y corta. El film de Nothing tiene una.",
            pieces: ["video-nothing-film"],
          },
          {
            term: "Beat sync",
            text: "es cuántos cortes caen sobre el beat. En el film de Nothing son 3 de 16. El promo del workshop corta en el beat a 120 BPM.",
            pieces: ["video-nothing-film", "promo"],
          },
          {
            term: "Cola de audio",
            text: "es el sonido que sigue después del corte de imagen. El film de Nothing deja 0.6 s de música sobre el negro final.",
            pieces: ["video-nothing-film"],
          },
          {
            term: "J-cut",
            text: "es cuando el audio del plano siguiente entra antes que su imagen.",
            pieces: [],
          },
          {
            term: "Jump cut",
            text: "es un corte dentro del mismo plano que salta en el tiempo.",
            pieces: [],
          },
          {
            term: "B-roll",
            text: "es el material de apoyo que cubre al plano principal.",
            pieces: [],
          },
          {
            term: "Kinetic type",
            text: "es texto animado superpuesto. El brief del film de Nothing lo pedía y la medición encontró cero.",
            pieces: ["video-nothing-film"],
          },
          {
            term: "Diegetic type",
            text: "es texto que vive dentro del mundo del video. En nuestro film todo el texto es salida real del CLI.",
            pieces: ["video-nothing-film"],
          },
          {
            term: "Exploded view",
            text: "es el despiece, con las partes separadas en profundidad. Nothing lo hace con el headphone y nosotros con un JSON en cinco placas.",
            pieces: ["video-nothing-film"],
          },
          {
            term: "LUFS",
            text: "mide la loudness integrada de un master. El film de Nothing está en -11.8 LUFS.",
            pieces: ["video-nothing-film"],
          },
        ],
      },
    ],
  },
  {
    id: "esta-hecho",
    title: "Cómo está hecho",
    groups: [
      {
        title: null,
        terms: [
          {
            term: "Fingerprint",
            text: "es identificar el stack de un sitio con evidencia. El de landonorris.com separa lo que vimos de lo que inferimos.",
            pieces: ["made-lando-stack"],
          },
          {
            term: "Bundle",
            text: "es el archivo que empaqueta el código de un sitio. El de landonorris.com pesa 1.3 MB y trae GSAP, Lenis, three.js y Rive.",
            pieces: ["made-lando-stack"],
          },
          {
            term: "Global",
            text: "es una variable que una librería deja en window. window.lenisVersion delata a Lenis, y window.gsap no existe aunque el sitio use GSAP.",
            pieces: ["made-lando-stack"],
          },
          {
            term: "Runtime",
            text: "es el sitio corriendo en el navegador, donde se prueba el comportamiento. La prueba de Lenis fue un wheel de 600 px que llegó frenando.",
            pieces: ["made-lando-stack"],
          },
          {
            term: "Computed styles",
            text: "son los estilos que el navegador termina aplicando a cada elemento. Así salió el morado real de Nubank.",
            pieces: ["brand-nubank-system"],
          },
          {
            term: "Custom properties",
            text: "son las variables de CSS donde un sitio declara sus tokens. Nubank declara ahí colores, radios y espaciado.",
            pieces: ["brand-nubank-system"],
          },
          {
            term: "WebGL",
            text: "es la tecnología del navegador para dibujar 3D en un canvas. landonorris.com usa un solo canvas a pantalla completa.",
            pieces: ["made-lando-stack", "look-lit-room"],
          },
          {
            term: "HTML-in-Canvas",
            text: "es una API de Chrome que deja a un canvas dibujar sus propios elementos HTML sin sacarlos del DOM. El monitor de Lit Room es una página de 1280 × 800 px que todavía recibe clics y tipeo. Necesita Chrome 157 o más nuevo, de escritorio.",
            pieces: ["look-lit-room"],
          },
          {
            term: "Homografía",
            text: "es la transformación que lleva un plano a otro en perspectiva. En Lit Room una sola dibuja la pantalla y ubica los clics sobre la página mientras la cámara orbita.",
            pieces: ["look-lit-room"],
          },
        ],
      },
    ],
  },
];

export const VOCABULARY_INTRO =
  "Todo lo que ves en internet tiene 3 capas, cómo se ve, cómo se mueve y cómo está hecho. Si nombras cada capa, se la puedes pedir a un agente. Esta página junta los nombres. Cada término va en una línea y, cuando existe, con un ejemplo medido en una de nuestras piezas.";

export const SLOP = [
  "Slop son los patrones que delatan a una IA. Los que nombramos en el workshop son el gradiente morado, el em dash, el pulse genérico y la fecha mal puesta en el footer. La landing de la galería empezó como slop, con todo centrado sobre un gradiente morado.",
  "Un acento deja de ser slop cuando tiene un rol.",
];
