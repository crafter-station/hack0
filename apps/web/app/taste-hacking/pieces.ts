/** Copy for the public piece pages. Every number comes from the recreation notes or the measurement files; a null field means the sources do not cover it. */

export type Layer = "look" | "motion" | "made" | "video" | "brand";

type Measured = {
  label: string;
  value: string;
  /** Where the value was read, or what it is compared against. */
  note?: string;
};

export type Piece = {
  /** Internal id: the gallery entry, the anchor on the material page and the session route. */
  slug: string;
  /** URL segment under /taste-hacking. */
  path: string;
  /** Chapter in the index. Recreations start at 05 and are grouped by layer. */
  chapter: number;
  layer: Layer;
  /** h1 of the page. */
  title: string;
  /** One line for the chapter index. */
  blurb: string;
  /** 60 characters or fewer. */
  seoTitle: string;
  /** 155 characters or fewer. */
  metaDescription: string;
  /** Null for the specimens built for the promo, which have no outside reference. */
  reference: { name: string; author: string; url: string } | null;
  layers: {
    seVe: string | null;
    seMueve: string | null;
    estaHecho: string | null;
  };
  antes: string | null;
  despues: string;
  measured: Measured[];
  breakdown: string[];
  lesson: string;
  paidTeaser: string;
  faq: { q: string; a: string }[];
  /** Pieces that share a word of the vocabulary with this one, and the word. */
  related: { slug: string; term: string }[];
};

/** Day the piece pages were written; the dated answers in the FAQs refer to it. */
export const PIECES_PUBLISHED = "2026-11-15";

export const CHAPTER_BY_LAYER: Record<Layer, { chapter: number; label: string }> = {
  look: { chapter: 5, label: "Se ve" },
  motion: { chapter: 6, label: "Se mueve" },
  made: { chapter: 7, label: "Está hecho" },
  video: { chapter: 8, label: "Video" },
  brand: { chapter: 9, label: "Marca" },
};

export const PIECES: Piece[] = [
  // 05 · Se ve
  {
    slug: "look-liquid-glass",
    path: "liquid-glass-apple",
    blurb: "Blur de 3 pt, refracción en el borde y un toggle que se vuelve lente en 150 ms.",
    related: [
      { slug: "toast", term: "easing" },
      { slug: "button", term: "duration" },
    ],
    chapter: 5,
    layer: "look",
    title: "Liquid Glass de Apple, rehecho en la web",
    seoTitle: "Cómo recrear Liquid Glass de Apple en la web",
    metaDescription:
      "Liquid Glass medido cuadro a cuadro y rehecho con CSS y un filtro SVG. Blur, refracción, rim y sombras con sus valores, y por qué el blur solo no alcanza.",
    reference: {
      name: "Apple introduces a delightful and elegant new software design",
      author: "Apple",
      url: "https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/",
    },
    layers: {
      seVe: "Refracción concentrada en el borde, blur leve, rim especular de brillo variable, sombras en dos capas y relleno plano sin grain.",
      seMueve: "Al tocarlo, el thumb crece a 1.65× con ease-out, viaja mientras está grande y se encoge con ease-in hasta volver a sólido.",
      estaHecho:
        "El original es nativo de iOS 26. En la web la refracción sale de un displacement map en SVG aplicado con backdrop-filter.",
    },
    antes: "El primer intento se leía como glassmorphism, con el interior esmerilado y las líneas de la grilla entrando derechas al borde.",
    despues:
      "Refracción en el borde además del blur. La barra de tabs curva la grilla que tiene detrás y un lente se levanta entre pestañas.",
    measured: [
      { label: "Escala del thumb en el pico", value: "1.65×", note: "1.62× en ancho y 1.68× en alto, medido a 60 fps" },
      { label: "Crecimiento", value: "150 ms, ease-out", note: "60% del camino en los primeros 33 ms" },
      { label: "Encogimiento", value: "130 ms, ease-in" },
      { label: "Gesto completo", value: "300 a 320 ms", note: "toggle de apagado a encendido" },
      {
        label: "Blur de la variante regular",
        value: "σ ≈ 5% del alto, unos 3 pt",
        note: "el glassmorphism clásico usa blur de 20 a 40 px",
      },
      { label: "Blur de la variante clear", value: "0", note: "el fondo pasa nítido y solo se deforma" },
      { label: "Tint blanco", value: "40% regular, 20% clear" },
      { label: "Compresión del fondo dentro del lente", value: "0.75×" },
      { label: "Desplazamiento en el borde", value: "3.1 pt vertical, 7.1 pt horizontal", note: "hacia adentro" },
      { label: "Rim especular", value: "1 pt en el toggle, 1.5 a 2 pt en la barra", note: "núcleo #FCFEFE" },
      {
        label: "Sombra al levantarse",
        value: "0 0 8px rgba(0,0,0,.04), 0 3px 10px rgba(0,0,0,.08)",
        note: "en reposo no hay sombra visible",
      },
      { label: "Radio", value: "alto / 2", note: "todo es cápsula o círculo" },
      { label: "Contraste del label negro", value: "4.29 sin glass, 9.65 sobre la pill", note: "sobre la misma card azul" },
      { label: "Blur y tint del resultado", value: "σ 2.5% del alto, tint 18%", note: "bajados tras la primera crítica" },
    ],
    breakdown: [
      "La página de Apple solo sirve videos, así que no hay CSS que inspeccionar. Bajamos los 8 y medimos sobre dos, el de los controles (toggle, slider y segmented) y el de la barra de tabs de Apple Music. Cada valor de esta página sale de pixeles de esos videos.",
      "Con los cuadros a la vista nombramos las capas. El material tiene dos variantes. La regular, la de la barra de tabs, lleva un blur leve y refracta solo en el borde. La clear aparece en el thumb mientras lo arrastras. No lleva blur y todo su cuerpo trabaja como un lente que comprime el fondo a 0.75×. Encima van un rim especular que cambia de brillo alrededor del borde y una sombra que solo aparece cuando el control se levanta.",
      "La sorpresa fue el blur. El de Apple ronda los 3 pt, contra los 20 a 40 px del glassmorphism. Aun con los valores medidos, el primer intento parecía vidrio esmerilado porque las líneas de la grilla entraban derechas al borde. Se arregló con una banda de borde más ancha y una distorsión de barril con caída cúbica, que curva las líneas cerca del rim y deja el centro plano.",
    ],
    lesson: "Blur solo es glassmorphism. Liquid Glass sale de la refracción concentrada en el borde.",
    paidTeaser: "La sesión completa muestra los prompts, las tres rondas de crítica y los archivos de la página, en unos 54 minutos.",
    faq: [
      {
        q: "¿Liquid Glass funciona en Safari y Firefox?",
        a: "La refracción de esta recreación solo funciona en Chromium, porque depende de backdrop-filter con un filtro SVG. En Safari y Firefox se ve una versión con blur, y la página lo avisa.",
      },
      {
        q: "¿Cuál es la diferencia entre Liquid Glass y glassmorphism?",
        a: "El glassmorphism es blur, tint y borde, y el fondo se ve borroso pero en su lugar. Liquid Glass desplaza el fondo como un lente, así que cerca del borde las líneas se curvan y se comprimen. Eso pide un displacement map, con blur no se logra.",
      },
    ],
  },
  {
    slug: "landing",
    path: "landing-hecha-con-ia",
    blurb: "De todo centrado sobre un gradiente morado a grilla y leading 0.95.",
    related: [{ slug: "brand-nubank-system", term: "leading" }],
    chapter: 5,
    layer: "look",
    title: "Una landing a la grilla con un solo acento",
    seoTitle: "Cómo hacer que una landing no parezca hecha con IA",
    metaDescription:
      "Una landing que tenía todo centrado sobre un gradiente morado, corregida con tres decisiones con nombre. Grilla, leading 0.95 y un solo acento.",
    reference: null,
    layers: {
      seVe: "Composición a la grilla, leading de 0.95 en el titular y un solo color de acento.",
      seMueve: null,
      estaHecho: null,
    },
    antes: "Todo centrado sobre un gradiente morado.",
    despues: "A la grilla, leading 0.95, un solo acento.",
    measured: [
      { label: "Leading", value: "0.95" },
      { label: "Colores de acento", value: "1" },
    ],
    breakdown: [
      "Esta pieza es un espécimen hecho para el promo del workshop, sin referencia externa. El punto de partida es la landing que entrega un agente cuando nadie le nombra nada, con todo centrado sobre un gradiente morado. En el vocabulario del workshop ese gradiente es slop, un patrón que delata a la IA.",
      "La corrección son tres decisiones de la capa de cómo se ve. El contenido se alinea a una grilla, el leading baja a 0.95 y el color queda en un solo acento. Cada una tiene nombre, y con ese nombre la puedes pedir.",
    ],
    lesson: "Una landing genérica se arregla con decisiones que tienen nombre, como grilla, leading y acento.",
    paidTeaser: "Esta pieza todavía no tiene sesión publicada. El workshop cubre el vocabulario que la nombra.",
    faq: [
      {
        q: "¿Cómo se nota que una landing la hizo una IA?",
        a: "Por patrones que se repiten. En el workshop los llamamos slop. Los que listamos son el gradiente morado, el em dash, el pulse genérico y la fecha mal puesta en el footer.",
      },
      {
        q: "¿Qué cambió entre el antes y el después de esta landing?",
        a: "Antes tenía todo centrado sobre un gradiente morado. Después el contenido va a la grilla, el leading es de 0.95 y hay un solo color de acento.",
      },
    ],
  },

  // 06 · Se mueve
  {
    slug: "motion-family-morph",
    path: "boton-family-continue-confirm",
    blurb: "Letras compartidas y una bandeja que crece desde el botón, con springs medidos cuadro a cuadro.",
    related: [
      { slug: "tabs", term: "spring" },
      { slug: "button", term: "press" },
    ],
    chapter: 6,
    layer: "motion",
    title: "De Continue a Confirm, el morph de botón de Family",
    seoTitle: "Cómo animar un botón que cambia de texto como en Family",
    metaDescription:
      "El morph de Continue a Confirm y la bandeja de Family, medidos cuadro a cuadro. Springs con stiffness y damping, duraciones y el orden en que se disparan.",
    reference: {
      name: "Family Values",
      author: "Benji Taylor",
      url: "https://benji.org/family-values",
    },
    layers: {
      seVe: "Una bandeja flotante con 16 pt de margen y 37 pt de radio, sobre un fondo que se oscurece al 30%.",
      seMueve:
        "Springs sin rebote visible, letras compartidas que se deslizan a su nuevo lugar y un stagger donde cada paso espera a que el anterior se asiente.",
      estaHecho: "El original es una app nativa de iOS y su código no está en la página. La recreación usa Vite, React y Motion.",
    },
    antes: "Con los valores correctos pero todo disparado en el mismo cuadro, el morph se perdía.",
    despues: "Un botón que cambia de texto con letras compartidas y una bandeja que crece desde él, con springs medidos cuadro a cuadro.",
    measured: [
      { label: "Spring de las letras", value: "stiffness 800, damping 56", note: "se asienta en 230 ms, sin overshoot" },
      { label: "Spring de la bandeja al abrir", value: "stiffness 1000, damping 60", note: "170 ms, overshoot de 0.3% o menos" },
      { label: "Spring de la bandeja al cerrar", value: "stiffness 925, damping 52", note: "150 ms, overshoot de 0.6%" },
      { label: "Press del botón", value: "escala 0.94 en 170 ms, ease-out" },
      { label: "Letra que entra", value: "70 ms", note: "fade con ease-out" },
      { label: "Letra que sale", value: "200 ms", note: "viaja con la palabra vieja mientras se apaga" },
      { label: "Icono que sale", value: "100 ms, escala de 1 a 0.8" },
      { label: "Fondo detrás de la bandeja", value: "negro al 30%", note: "sincronizado con la bandeja" },
      { label: "Bandeja", value: "16 pt de margen, 37 pt de radio" },
      { label: "Botón dentro de la bandeja", value: "148 pt", note: "se encoge con el borde derecho fijo" },
      { label: "Loop del resultado", value: "4 s" },
    ],
    breakdown: [
      "La referencia es el ensayo 'Family Values' de Benji Taylor sobre la wallet Family. Los clips del ensayo son grabaciones de pantalla de iPhone a 60 fps, y el código de la app no está en la página. Todo se midió sobre esas grabaciones, siguiendo posiciones cuadro a cuadro y ajustando un spring a cada curva.",
      "Nombramos el mecanismo antes de reconstruirlo. Las letras son elementos sueltos. Las que comparten las dos palabras (C, o, n, i) conservan su identidad y se deslizan a su nuevo lugar, y las demás hacen crossfade. La bandeja nace del botón, que se queda como la mitad derecha mientras Cancel aparece a la izquierda.",
      "La sorpresa es que el morph y la bandeja viven en pantallas distintas del ensayo. El cambio de texto sale del flujo de envío y la bandeja de otros dos clips. Esta pieza los junta en una sola pantalla. La otra sorpresa fue de método. Una caja fija sobre el título mostraba un comportamiento falso, y una caja que sigue el borde de la bandeja mostró que el contenido viaja con ella y hace fade con su mismo spring, sin blur.",
    ],
    lesson: "La coreografía también se mide. Compara la secuencia completa además de cada curva.",
    paidTeaser:
      "La sesión completa muestra cómo se siguió cada clip cuadro a cuadro, cómo se ajustaron los springs y los archivos del resultado, en unos 44 minutos.",
    faq: [
      {
        q: "¿Qué valores de spring usa la animación de Family?",
        a: "Family no publica sus valores. Los que ajustamos sobre los clips del ensayo son stiffness 800 y damping 56 para las letras, 1000 y 60 para abrir la bandeja, y 925 y 52 para cerrarla.",
      },
      {
        q: "¿Cómo cambio el texto de un botón sin que salte?",
        a: "Trata cada letra como un elemento. En esta pieza, las letras que comparten Continue y Confirm se deslizan a su nuevo lugar con un spring que se asienta en 230 ms. Las que entran aparecen en 70 ms y las que salen se apagan en 200 ms.",
      },
    ],
  },
  {
    slug: "toast",
    path: "animacion-toast",
    blurb: "De scale(0) con ease-in a una entrada con ease-out.",
    related: [{ slug: "look-liquid-glass", term: "easing" }],
    chapter: 6,
    layer: "motion",
    title: "Un toast que entra desde abajo y se apila",
    seoTitle: "Cómo animar un toast para que entre con ease-out",
    metaDescription:
      "Un toast que salía desde scale(0) con ease-in, corregido para entrar desde abajo con ease-out y apilarse. Antes y después en un clip corto.",
    reference: null,
    layers: {
      seVe: null,
      seMueve: "Entrada desde abajo con ease-out, y cada toast nuevo se apila sobre el anterior.",
      estaHecho: null,
    },
    antes: "Salía desde scale(0) con ease-in.",
    despues: "Entra desde abajo con ease-out y se apila.",
    measured: [
      { label: "Escala inicial antes", value: "scale(0)" },
      { label: "Easing", value: "de ease-in a ease-out" },
    ],
    breakdown: [
      "Esta pieza es un espécimen hecho para el promo del workshop, sin referencia externa. El toast original aparecía creciendo desde scale(0) con ease-in.",
      "La corrección cambia dos cosas de la capa de cómo se mueve. El toast entra desde abajo con ease-out, y cuando llega otro se apila. Las fuentes de esta pieza no registran duraciones, así que la página no publica ninguna.",
    ],
    lesson: "El origen y el easing de una entrada tienen nombre, y con ese nombre los puedes pedir.",
    paidTeaser: "Esta pieza todavía no tiene sesión publicada. El workshop cubre el vocabulario que la nombra.",
    faq: [
      {
        q: "¿Con qué easing debe entrar un toast?",
        a: "En esta pieza entra con ease-out y desde abajo. La versión anterior usaba ease-in y crecía desde scale(0).",
      },
      {
        q: "¿Qué pasa cuando aparecen varios toasts seguidos?",
        a: "En la versión corregida se apilan. Cada toast nuevo entra desde abajo con ease-out.",
      },
    ],
  },
  {
    slug: "button",
    path: "boton-al-presionar",
    blurb: "scale(0.97) al presionar, en 150 ms.",
    related: [
      { slug: "motion-family-morph", term: "press" },
      { slug: "look-liquid-glass", term: "duration" },
    ],
    chapter: 6,
    layer: "motion",
    title: "Un botón que responde cuando lo presionas",
    seoTitle: "Cómo animar un botón al presionarlo con scale en CSS",
    metaDescription:
      "Un botón que no respondía y animaba con transition: all, corregido con scale(0.97) al presionar en 150 ms. Antes y después en un clip corto.",
    reference: null,
    layers: {
      seVe: null,
      seMueve: "Feedback de press con scale(0.97) en 150 ms.",
      estaHecho: "El punto de partida declaraba la animación con transition: all.",
    },
    antes: "No respondía y animaba con transition: all.",
    despues: "scale(0.97) al presionar, en 150 ms.",
    measured: [
      { label: "Escala al presionar", value: "0.97" },
      { label: "Duración", value: "150 ms" },
    ],
    breakdown: [
      "Esta pieza es un espécimen hecho para el promo del workshop, sin referencia externa. El botón original no daba ninguna respuesta al presionarlo y declaraba su animación con transition: all.",
      "La corrección es un solo gesto. Al presionar, el botón baja a scale(0.97) en 150 ms. Sirve de comparación la recreación de Family, donde el press medido fue de 0.94 en 170 ms.",
    ],
    lesson: "Un botón se siente vivo cuando responde al press con una escala y una duración concretas.",
    paidTeaser: "Esta pieza todavía no tiene sesión publicada. El workshop cubre el vocabulario que la nombra.",
    faq: [
      {
        q: "¿Cuánto debe encogerse un botón al presionarlo?",
        a: "En esta pieza baja a scale(0.97) en 150 ms. En la recreación de Family medimos un press de 0.94 en 170 ms con ease-out.",
      },
      {
        q: "¿Qué tenía de malo el botón original?",
        a: "No respondía al presionarlo y animaba con transition: all. La versión corregida responde con scale(0.97) en 150 ms.",
      },
    ],
  },
  {
    slug: "tabs",
    path: "tabs-con-spring",
    blurb: "Una layout animation con spring donde antes había un salto.",
    related: [{ slug: "motion-family-morph", term: "spring" }],
    chapter: 6,
    layer: "motion",
    title: "Tabs con un indicador que viaja",
    seoTitle: "Cómo animar el indicador de unas tabs con spring",
    metaDescription:
      "Unas tabs donde el indicador saltaba de golpe, corregidas con una layout animation. El indicador viaja de una pestaña a otra con spring.",
    reference: null,
    layers: {
      seVe: null,
      seMueve: "El indicador viaja entre pestañas con una layout animation movida por un spring.",
      estaHecho: null,
    },
    antes: "El indicador saltaba de golpe.",
    despues: "El indicador viaja con spring (layout animation).",
    measured: [],
    breakdown: [
      "Esta pieza es un espécimen hecho para el promo del workshop, sin referencia externa. En las tabs originales el indicador desaparecía de una pestaña y aparecía en la otra, sin recorrido.",
      "La corrección tiene nombre propio. Una layout animation anima el cambio de posición o de tamaño de un elemento entre dos layouts, y aquí la mueve un spring. Las fuentes de esta pieza no registran los valores del spring, así que la página no publica ninguno. Los springs medidos están en la recreación de Family.",
    ],
    lesson: "Cuando un elemento cambia de lugar, pide una layout animation y dile con qué se mueve.",
    paidTeaser: "Esta pieza todavía no tiene sesión publicada. El workshop cubre el vocabulario que la nombra.",
    faq: [
      {
        q: "¿Qué es una layout animation?",
        a: "Es animar el cambio de posición o de tamaño de un elemento entre dos layouts. En estas tabs, el indicador viaja de una pestaña a la otra.",
      },
      {
        q: "¿Por qué el indicador de mis tabs salta de una pestaña a otra?",
        a: "Así se comportaba esta pieza antes de la corrección. Se arregló con una layout animation movida por un spring, y el indicador pasó a recorrer la distancia entre pestañas.",
      },
    ],
  },

  // 07 · Está hecho
  {
    slug: "made-lando-stack",
    path: "stack-landonorris",
    blurb: "Webflow, GSAP 3.13.0, Lenis 1.1.20 y three.js r174, con la evidencia de cada uno.",
    related: [{ slug: "brand-nubank-system", term: "cómo está hecho" }],
    chapter: 7,
    layer: "made",
    title: "landonorris.com por dentro",
    seoTitle: "Con qué está hecho landonorris.com, el sitio de Lando Norris",
    metaDescription:
      "El stack de landonorris.com verificado en vivo. Webflow, GSAP 3.13.0, Lenis 1.1.20, three.js r174 y Rive, con la evidencia de cada uno.",
    reference: {
      name: "landonorris.com",
      author: "OFF+BRAND",
      url: "https://landonorris.com",
    },
    layers: {
      seVe: "Un solo canvas WebGL a pantalla completa, con fondo transparente, superpuesto al DOM.",
      seMueve: "Smooth scroll con Lenis en lerp 0.1 y animación scrubbed, donde el scroll mueve el 3D sin pinear la sección.",
      estaHecho: "Webflow como cascarón y un bundle propio de la agencia con GSAP, ScrollTrigger, Lenis, three.js y Rive.",
    },
    antes: "El busto solo rotaba y se sentía plano, como en un torno.",
    despues: "El stack identificado en vivo (Lenis, GSAP, three.js) y un mecanismo rehecho, un busto 3D que gira con el scroll.",
    measured: [
      { label: "GSAP", value: "3.13.0", note: "con ScrollTrigger, SplitText y MotionPath, leído en el bundle" },
      { label: "Lenis", value: "1.1.20", note: "window.lenisVersion en el runtime" },
      { label: "three.js", value: "r174", note: "window.__THREE__ en el runtime" },
      { label: "Rive", value: "@rive-app/canvas-lite 2.26.4", note: "20 canvases en el DOM" },
      { label: "jQuery", value: "3.5.1", note: "lo inyecta Webflow por defecto" },
      { label: "Lenis lerp", value: "0.1", note: "sin duration, corre sobre gsap.ticker con lagSmoothing(0)" },
      { label: "Prueba de wheel de 600 px", value: "scrollY 463, 519, 540, 556, 564, 573", note: "el scroll llega con easing" },
      { label: "Dolly de cámara", value: "z de 0 a -1, y de 0 a 0.1, power1.inOut", note: "dentro del mismo scrub" },
      { label: "Scrub de Rive", value: "0.5" },
      { label: "Apariciones de pin en el código propio", value: "0" },
      { label: "Bundle activo", value: "1.3 MB", note: "el único script de la agencia que corre, los demás están comentados en el HTML" },
      { label: "Rotación del resultado", value: "de 0 a 360 grados", note: "scrubbed por el scroll, en un loop de 6 s para el clip" },
      { label: "Frame time del resultado", value: "p95 de 16.7 a 16.8 ms", note: "wheel real con CPU a 4x, sin long tasks" },
    ],
    breakdown: [
      "landonorris.com es obra de la agencia OFF+BRAND y fue Site of the Year 2025 en Awwwards. Capturamos los headers, el HTML y los scripts, y después verificamos cada librería en el navegador. El reporte separa dos columnas, lo que vimos y lo que inferimos.",
      "El veredicto es Webflow como CMS y hosting, con toda la experiencia en un solo bundle de la agencia. La sorpresa llegó con GSAP. En la consola, window.gsap da undefined, porque la librería va empaquetada como módulo y no deja ningún global. La versión 3.13.0 aparece en el banner del bundle. Con Lenis pasó lo contrario. El CSS pegado en el HTML no probaba nada, y la prueba fue de comportamiento, con un wheel de 600 px que llegó frenando.",
      "La segunda sorpresa es que el 3D va scrubbed pero sin pin. El canvas queda fijo y un plano sigue a los elementos del DOM con el scroll de Lenis. Para el workshop rehicimos un mecanismo con un busto de mármol CC0 que gira con el scroll. Ahí sí pineamos la sección, una diferencia consciente para que el scrub se lea claro. Del sitio original no usamos ningún asset.",
    ],
    lesson: "Los globals mienten por omisión. Verifica cada librería en el bundle y en el runtime.",
    paidTeaser:
      "La sesión completa muestra el fingerprint paso a paso, las cuatro rondas de crítica y el código del mecanismo rehecho, en unos 31 minutos.",
    faq: [
      {
        q: "¿Con qué está hecho landonorris.com?",
        a: "Al 15 de noviembre de 2026 corre sobre Webflow, con un bundle propio de OFF+BRAND que empaqueta GSAP 3.13.0 con ScrollTrigger y SplitText, Lenis 1.1.20, three.js r174 y Rive. No encontramos Lottie ni Spline en el bundle activo.",
      },
      {
        q: "¿Por qué window.gsap da undefined en un sitio que usa GSAP?",
        a: "Porque GSAP va importado como módulo dentro del bundle y no se expone en window. Revisar los globals da un falso negativo. La prueba está en el bundle, donde aparece el banner de GSAP 3.13.0.",
      },
    ],
  },

  // 08 · Video
  {
    slug: "video-nothing-film",
    path: "film-producto-nothing",
    blurb: "31.9 cortes por minuto, cero texto superpuesto y una edición que ignora el beat.",
    related: [{ slug: "promo", term: "beat sync" }],
    chapter: 8,
    layer: "video",
    title: "El oficio de un film de Nothing, aplicado a un CLI",
    seoTitle: "Cómo analizar el estilo de edición de un video de producto",
    metaDescription:
      "Un film de producto de Nothing medido corte por corte. 31.9 cortes por minuto, cero texto superpuesto, -11.8 LUFS, y el mismo oficio aplicado a un CLI.",
    reference: {
      name: "Film de producto de 30 s (headphone)",
      author: "Nothing",
      url: "https://www.youtube.com/watch?v=oRZ6PX8abfo",
    },
    layers: {
      seVe: "Imagen low-key con rim light, un solo color de acento y cero texto superpuesto.",
      seMueve:
        "Hard cuts a 31.9 cortes por minuto con pico de ritmo en el segundo cuarto, cámara siempre en movimiento lento y cierre seco a negro.",
      estaHecho: "El resultado está hecho en Remotion, con la salida real del CLI como único texto y música instrumental propia a 108 BPM.",
    },
    antes:
      "El brief pedía kinetic type de puntos y cortes en el beat. La medición encontró cero texto superpuesto y 19% de cortes en el beat.",
    despues: "El oficio del film aplicado a un CLI, 18 segundos en Remotion con la salida real del comando.",
    measured: [
      { label: "Cortes por minuto", value: "31.9", note: "el resultado mide 32.8" },
      { label: "Shot mediano", value: "1.68 s", note: "el resultado mide 1.7 s" },
      { label: "Ritmo por cuartos", value: "23.9 / 55.9 / 31.9 / 16.0 cortes por minuto", note: "pico en el segundo cuarto" },
      { label: "Cortes en el beat", value: "3 de 16 (19%)", note: "al azar caería 25%, sobre un pulso de 93 BPM" },
      { label: "Texto superpuesto", value: "0", note: "el único texto está impreso en el producto" },
      { label: "Brillo promedio", value: "mean luma 0.095", note: "el resultado mide 0.079" },
      { label: "Color dominante", value: "#030404 en 72% del cuadro" },
      { label: "Loudness", value: "-11.8 LUFS", note: "el resultado mide -12.3 LUFS con true peak de -2.2 dBTP" },
      { label: "Rango de loudness", value: "LRA 5.9 LU" },
      { label: "Duración", value: "30.07 s en 17 shots", note: "el resultado dura 18.3 s" },
      { label: "Aparición del acento", value: "8.8 s (29% del film)" },
      { label: "Música del resultado", value: "108 BPM", note: "a propósito distinta de los 93 de la referencia" },
    ],
    breakdown: [
      "La referencia es un film de producto de Nothing de 30 segundos, para un headphone. Antes de escribir el brief lo medimos completo. Salieron los cortes por minuto, el largo de cada plano, el brillo promedio, la paleta y el loudness del master.",
      "La medición desmintió el brief. Pedía kinetic type de puntos y cortes en el beat, y el film tiene cero texto superpuesto. Solo 3 de sus 16 cortes caen en el beat, menos que los 4 que caerían al azar. El pulso de 93 BPM existe y la edición lo ignora. La tipografía de puntos es identidad de Nothing y en este film ni aparece. Con el brief original habríamos copiado algo que el film no tiene.",
      "Después tradujimos el objeto. El resultado es un film de 18.3 segundos para el CLI de hack0. El headphone pasa a ser el banner del CLI extruido con rim light, y el despiece pasa a ser el JSON de respuesta abierto en cinco placas. El rojo, el producto y la música de Nothing quedaron afuera. El cierre y el despiece fallaron primero por chicos, y se arreglaron con punch-ins hasta que cada plano se pudo leer.",
    ],
    lesson: "Mide antes de escribir el brief. El estilo que recuerdas puede no estar en el video.",
    paidTeaser:
      "La sesión completa muestra la medición del film, la receta de estilo, las dos rondas de crítica y el proyecto de Remotion, en unos 67 minutos.",
    faq: [
      {
        q: "¿Cuántos cortes por minuto tiene un video de producto?",
        a: "Este film de Nothing tiene 31.9 cortes por minuto y un shot mediano de 1.68 segundos. El ritmo sube en el segundo cuarto, a 55.9, y frena al final. Es la medida de un film, no una regla general.",
      },
      {
        q: "¿Los cortes de un video tienen que caer en el beat de la música?",
        a: "En este film casi ninguno cae ahí. Solo 3 de 16 cortes coinciden con el beat, menos de lo que daría el azar. Otra pieza de esta galería, el promo del workshop, hace lo contrario y corta en el beat a 120 BPM.",
      },
    ],
  },
  {
    slug: "promo",
    path: "video-promo-con-codigo",
    blurb: "Cortes en el beat a 120 BPM.",
    related: [{ slug: "video-nothing-film", term: "beat sync" }],
    chapter: 8,
    layer: "video",
    title: "El promo del workshop, 38 segundos hechos en código",
    seoTitle: "Cómo hacer un video promocional con código",
    metaDescription:
      "El promo de Taste hacking dura 38 segundos, está hecho en código y corta en el beat a 120 BPM. Compáralo con un film que ignora el beat.",
    reference: null,
    layers: {
      seVe: null,
      seMueve: "Cortes en el beat, sobre una música a 120 BPM.",
      estaHecho: "Hecho en código de principio a fin.",
    },
    antes: null,
    despues: "38 segundos hechos en código, con cortes en el beat a 120 BPM.",
    measured: [
      { label: "Duración", value: "38 s" },
      { label: "Tempo", value: "120 BPM", note: "los cortes caen en el beat" },
    ],
    breakdown: [
      "Este es el video que anuncia el workshop. Dura 38 segundos, está hecho en código y sus cortes caen en el beat de una música a 120 BPM. Es la única pieza de la galería pensada para verse con sonido.",
      "Sirve de contraste con el film de Nothing de esta misma galería. Aquel ignora el beat, con 3 de 16 cortes sobre el pulso. Este corta sobre él. Las dos son decisiones de edición con nombre, y cualquiera de las dos se puede pedir. Las fuentes de esta pieza no registran más medidas, así que la página no publica otras.",
    ],
    lesson: "Cortar en el beat es una decisión de edición, y se puede pedir por su nombre.",
    paidTeaser: "Esta pieza todavía no tiene sesión publicada. El workshop cubre el vocabulario que la nombra.",
    faq: [
      {
        q: "¿Se puede hacer un video promocional con código?",
        a: "Sí. Este promo dura 38 segundos y está hecho en código, con los cortes puestos en el beat de la música.",
      },
      {
        q: "¿A cuántos BPM está cortado el promo?",
        a: "A 120 BPM, con los cortes en el beat. El film de Nothing de esta galería tiene un pulso de 93 BPM y su edición lo ignora.",
      },
    ],
  },

  // 09 · Marca
  {
    slug: "brand-nubank-system",
    path: "sistema-de-marca-nubank",
    blurb: "El morado real es #8D0DE3 y las reglas pasan a otra marca sin llevarse los colores.",
    related: [
      { slug: "landing", term: "leading" },
      { slug: "made-lando-stack", term: "cómo está hecho" },
    ],
    chapter: 9,
    layer: "brand",
    title: "El sistema de marca de Nubank, medido y traducido a hack0",
    seoTitle: "Colores y tipografía de Nubank, el sistema de marca medido",
    metaDescription:
      "El refresh 2026 de Nubank medido en el sitio en vivo. El morado real es #8D0DE3, Nu Sans salta de 22 a 34 px y las reglas se traducen a otra marca.",
    reference: {
      name: "Nubank, brand refresh 2026",
      author: "Koto y el equipo de Nubank",
      url: "https://nubank.com.br",
    },
    layers: {
      seVe: "Paleta con roles, dos cortes ópticos de Nu Sans sin tamaños intermedios, controles pill y el logo en un contenedor cuadrado.",
      seMueve: null,
      estaHecho:
        "Tokens en CSS custom properties, escala de espaciado con base de 4 px y tokens fantasma que siguen declarados sin que nada los use.",
    },
    antes: "El brief traía de memoria el morado #820AD1. En el sitio en vivo ningún elemento lo usa.",
    despues: "El sistema medido en vivo y traducido a una plantilla de marca para hack0, que copia las reglas y cambia los colores.",
    measured: [
      { label: "Morado que renderiza", value: "#8D0DE3", note: "token brand-core-P" },
      { label: "Morado fantasma", value: "#820AD1", note: "declarado como brand-co-P, sin uso en nubank.com.br" },
      { label: "Neutro oscuro", value: "#1E002F", note: "un morado casi negro" },
      { label: "Neutro claro", value: "#F3EFE6", note: "arena" },
      {
        label: "Fuentes servidas",
        value: "Nu Sans Display y Nu Sans Text, pesos 400, 500 y 600",
        note: "Graphik está declarada y no se descarga",
      },
      { label: "Cortes ópticos", value: "Display desde 34 px, Text hasta 22 px", note: "no hay texto entre 23 y 33 px" },
      { label: "Statement", value: "156 px, tracking de -3.4 px, peso 600" },
      { label: "Line-height del Display", value: "0.94" },
      {
        label: "Escala de radios",
        value: "0, 12, 16, 24, 32, 48, 999 px",
        note: "controles pill, superficies redondeadas, marca cuadrada",
      },
      { label: "Espaciado", value: "base de 4 px, gutter de 88 px", note: "contenido de 1264 px en un desktop de 1440" },
      { label: "Logo en contenedor", value: "64×64 px, radio 0", note: "símbolo al 55% del ancho, pegado al borde superior" },
      { label: "Acento de hack0", value: "#FF3D00", note: "reservado para lo que viene" },
      { label: "Neutros de hack0", value: "ink #111110, paper #F3F0E8" },
      { label: "Cortes de hack0", value: "Display desde 32 px, Text hasta 20 px", note: "JetBrains Mono en los dos" },
      { label: "Área de color en hack0", value: "ink 85%, paper 9%, mute 3%, acento 3%" },
    ],
    breakdown: [
      "El refresh 2026 de Nubank es de Koto con el equipo interno de la marca. Cada valor sale del sitio en vivo, de tres páginas distintas. Leímos las fuentes que se sirven, las custom properties y los computed styles de cada elemento, y agrupamos los colores por rol. Para la voz contamos palabras sobre el texto de la home.",
      "La sorpresa fue el morado. El brief traía #820AD1, el morado histórico de Nubank. Ese valor sigue declarado, pero en nubank.com.br no lo usa ningún elemento. El que renderiza es #8D0DE3. Al primero lo llamamos token fantasma. Con Graphik pasa lo mismo, porque está declarada y nunca se descarga.",
      "Después tradujimos reglas y dejamos los colores. Nubank garantiza su morado porque el logo lo lleva en el contenedor. En hack0 el naranja está garantizado por el slash del cero y significa una sola cosa, lo que viene. El salto de 22 a 34 px entre Text y Display pasa a ser un salto de 20 a 32 px en JetBrains Mono. El resultado es una página de marca para hack0 sin ningún asset de Nubank.",
    ],
    lesson: "Mide, no recuerdes. Los computed styles le ganan a lo que crees saber de una marca.",
    paidTeaser:
      "La sesión completa muestra la extracción del sistema, la plantilla de marca llena dos veces y las dos rondas de crítica, en unos 66 minutos.",
    faq: [
      {
        q: "¿Cuál es el código del color morado de Nubank?",
        a: "En nubank.com.br, al 15 de noviembre de 2026, el morado que renderiza es #8D0DE3. El #820AD1 histórico sigue declarado en el CSS, pero no lo usa ningún elemento del sitio.",
      },
      {
        q: "¿Qué tipografía usa Nubank?",
        a: "El sitio sirve Nu Sans en dos cortes. Nu Sans Display va de 34 px para arriba y Nu Sans Text de 22 px para abajo, los dos en pesos 400, 500 y 600. Graphik sigue declarada en el CSS y no se descarga.",
      },
    ],
  },
];

const BASE = "/taste-hacking";

export function pieceHref(piece: Piece): string {
  return `${BASE}/${piece.path}`;
}

export function pieceBySlug(slug: string): Piece | undefined {
  return PIECES.find((p) => p.slug === slug);
}

export function pieceByPath(path: string): Piece | undefined {
  return PIECES.find((p) => p.path === path);
}
