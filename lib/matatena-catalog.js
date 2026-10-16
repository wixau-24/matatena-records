/**
 * Catálogo maestro de Matatena Records:
 * - Configuraciones por defecto (horario 10:00 a 22:00, precios en MXN, horas extra $400/hr)
 * - Las 3 líneas de negocio ("Las Jugadas") y sus grados
 * - Inventario base: 1 Sala, 1 Consola y 2 instrumentos por categoría
 */

export const DEFAULT_STUDIO_SETTINGS = {
  id: 'default',
  open_hour: 10,
  close_hour: 22,
  base_hours: 4,
  extra_hour_rate: 400,
  pricing: {
    grado_1: 2000,
    grado_2: 3000,
    grado_3: 4000,
    experiencia_compositora: 4500
  },
  blocked_slots: []
};

export const SERVICE_TIERS = [
  {
    id: 'grado_1',
    serviceType: 'estudio_personalizado',
    code: 'JUGADA 01 · GRADO I',
    jacksCount: 1,
    jackLabel: 'De a Una',
    title: 'Estudio Personalizado · Grado I',
    subtitle: 'Solo Espacio + Consola + Instrumentos (Sin Ingeniero ni Productor)',
    shortTitle: 'Grado I · Solo Espacio',
    priceKey: 'grado_1',
    defaultPriceMxn: 2000,
    baseHours: 4,
    isCustomQuote: false,
    badge: 'Autonomía Total',
    description:
      'Renta directa del cuarto creativo con la consola y todos los instrumentos listos para sonar. Pensado para músicos, productores y proyectos que saben operar sus propios programas (DAW) y ejecutar los instrumentos por su cuenta.',
    includes: [
      '4 horas de uso exclusivo de la Sala Creativa',
      'Acceso total a la Consola principal y monitoreo',
      'Uso libre de todos los instrumentos (2 guitarras, 2 baterías, 2 pianos, 2 sintes, 2 bajos)',
      'Sin ingeniero ni productor incluido (tú tomas el control total)'
    ],
    idealFor: 'Productores independientes, bandas autogestivas y compositores que buscan un cuarto inspirador listo para conectar y grabar.'
  },
  {
    id: 'grado_2',
    serviceType: 'estudio_personalizado',
    code: 'JUGADA 01 · GRADO II',
    jacksCount: 2,
    jackLabel: 'De a Dos',
    title: 'Estudio Personalizado · Grado II',
    subtitle: 'Espacio + Consola + Instrumentos + Ingeniero y/o Productor',
    shortTitle: 'Grado II · + Ingeniero/Productor',
    priceKey: 'grado_2',
    defaultPriceMxn: 3000,
    baseHours: 4,
    isCustomQuote: false,
    badge: 'Más Popular',
    description:
      'Toda la riqueza instrumental de la sala sumando un ingeniero de audio y/o productor dedicado a tu sesión. Olvídate de la fricción técnica: nosotros microfoneamos, operamos la consola y moldeamos el sonido mientras tú fluyes.',
    includes: [
      '4 horas en la Sala Creativa con todo el backline e instrumentos',
      'Ingeniero de grabación y/o productor musical durante toda la sesión',
      'Microfoneo profesional, ruteo en consola y captura en tu DAW preferido',
      'Dirección técnica y sonora para aterrizar tus maquetas o tracks finales'
    ],
    idealFor: 'Solistas, bandas y creadores que quieren concentrarse al 100% en tocar y cantar con respaldo técnico y de producción.'
  },
  {
    id: 'grado_3',
    serviceType: 'estudio_personalizado',
    code: 'JUGADA 01 · GRADO III',
    jacksCount: 3,
    jackLabel: 'De a Tres',
    title: 'Estudio Personalizado · Grado III',
    subtitle: 'Espacio + Ingeniero + Compositor en Sesión',
    shortTitle: 'Grado III · + Ingeniero + Compositor',
    priceKey: 'grado_3',
    defaultPriceMxn: 4000,
    baseHours: 4,
    isCustomQuote: false,
    badge: 'Tridente Creativo',
    description:
      'La experiencia máxima de generación de ideas. Además del espacio, los instrumentos y el ingeniero, entra a la jugada un compositor de casa para co-escribir letras, destrabar melodías, proponer armonías y estructurar tu obra de principio a fin.',
    includes: [
      '4 horas de estudio completo con consola y todos los instrumentos',
      'Ingeniero de grabación y productor operando la sesión en tiempo real',
      'Compositor profesional trabajando mano a mano contigo en letra, melodía y arreglos',
      'Entrega de sesión y maqueta estructurada al finalizar el bloque'
    ],
    idealFor: 'Artistas que traen una semilla de idea y quieren salir del estudio con una canción redonda, escrita y grabada.'
  },
  {
    id: 'experiencia',
    serviceType: 'experiencia_compositora',
    code: 'JUGADA 02 · COMUNIDAD',
    jacksCount: 4,
    jackLabel: 'Ronda Colectiva',
    title: 'Experiencia Compositora',
    subtitle: 'Inmersión Musical Guiada · Individual o en Grupo · Todas las Edades',
    shortTitle: 'Experiencia Compositora',
    priceKey: 'experiencia_compositora',
    defaultPriceMxn: 4500,
    baseHours: 4,
    isCustomQuote: false,
    badge: 'Todas las Edades · Comunidad',
    description:
      'Una experiencia viva para adentrarse en el proceso real de crear música, guiada personalmente por mí y por artistas invitados. Diseñada tanto para una sola persona como para grupos, familias o amigos de cualquier edad que quieran experimentar cómo nace una canción desde cero.',
    includes: [
      '4 horas de sesión creativa guiada paso a paso por artistas y anfitrión',
      'Abierto a todas las edades y niveles (no se requiere experiencia musical previa)',
      'Dinámica de juego creativo: lluvia de ideas, ritmo, letra, instrumentos reales y grabación vocal',
      'Recuerdo sonoro: te llevas la grabación de la pieza creada en comunidad'
    ],
    idealFor: 'Familias, grupos de amigos, equipos creativos, niños, jóvenes o adultos curiosos por vivir el estudio desde adentro.'
  },
  {
    id: 'evento_multiple',
    serviceType: 'uso_multiple',
    code: 'JUGADA 03 · MESA ABIERTA',
    jacksCount: 6,
    jackLabel: 'Mesa Abierta',
    title: 'Renta de Espacio · Uso Múltiple',
    subtitle: 'Listening Parties · Lanzamientos de Disco · Showcases · Sesiones en Vivo',
    shortTitle: 'Uso Múltiple · Evento Especial',
    priceKey: null,
    defaultPriceMxn: 0,
    baseHours: 4,
    isCustomQuote: true,
    badge: 'Cotización a Medida',
    description:
      'El estudio se abre como galería y foro íntimo. Úsalo para escuchar el lanzamiento de un disco (listening party), presentar un showcase acústico o con instrumentos en vivo (sin necesidad de usar la consola de grabación), grabar contenido audiovisual o realizar activaciones culturales.',
    includes: [
      'Configuración flexible de la sala según el formato de tu evento o actividad',
      'Sistema de audio de alta fidelidad para listening sessions o instrumentos en vivo',
      'Opción de usar el espacio e instrumentos sin requerir consola de grabación',
      'Iluminación cálida editorial y atmósfera estética lista para invitados o cámaras'
    ],
    idealFor: 'Estrenos de álbum, showcases íntimos, sesiones en vivo, podcasts visuales, talleres creativos y encuentros de arte.'
  }
];

export const DEFAULT_GEAR_CATALOG = [
  {
    id: 'sala-principal',
    category: 'espacio',
    category_label: '1 Sala Creativa',
    name: 'Sala "El Patio de Ideas"',
    spec: 'Estudio único con tratamiento acústico cálido en madera, luz natural/editorial regulable y zona de composición.',
    badge: '1 Sala Exclusiva',
    available: true,
    sort_order: 1
  },
  {
    id: 'consola-principal',
    category: 'consola',
    category_label: '1 Consola Central',
    name: 'Consola Híbrida Analógica 24 Canales + Summing',
    spec: 'Preamplificadores clase A, puente de medidores VU analógicos e integración directa por USB/Thunderbolt a cualquier DAW.',
    badge: '1 Consola',
    available: true,
    sort_order: 2
  },
  {
    id: 'guitarra-1',
    category: 'guitarras',
    category_label: '2 Guitarras',
    name: 'Fender Stratocaster American Vintage',
    spec: 'Guitarra eléctrica · Configuración SSS con timbre cristalino, expresivo y versátil para funk, indie, pop y rock.',
    badge: 'Guitarra 01 / 02',
    available: true,
    sort_order: 3
  },
  {
    id: 'guitarra-2',
    category: 'guitarras',
    category_label: '2 Guitarras',
    name: 'Gibson ES-335 Semi-Hollow / Martin Electroacústica',
    spec: 'Cuerpo cálido y resonante ideal para acordes abiertos, jazz, folk contemporáneo y texturas orgánicas de composición.',
    badge: 'Guitarra 02 / 02',
    available: true,
    sort_order: 4
  },
  {
    id: 'bateria-1',
    category: 'baterias',
    category_label: '2 Baterías',
    name: 'Ludwig Classic Maple Studio Set',
    spec: 'Bombo de 22", tarola Supraphonic y toms con ataque redondo y profundo para producciones modernas.',
    badge: 'Batería 01 / 02',
    available: true,
    sort_order: 5
  },
  {
    id: 'bateria-2',
    category: 'baterias',
    category_label: '2 Baterías',
    name: 'Gretsch Vintage Club Kit (Dry / Lo-Fi)',
    spec: 'Set compacto afinado con fieltros para un timbre seco, íntimo y cálido estilo R&B, soul y bedroom pop.',
    badge: 'Batería 02 / 02',
    available: true,
    sort_order: 6
  },
  {
    id: 'piano-1',
    category: 'pianos',
    category_label: '2 Pianos',
    name: 'Piano Vertical Acústico Yamaha U1 (Con Fieltro)',
    spec: 'Piano acústico real con barra de fieltro opcional para lograr desde un sonido brillante hasta un timbre íntimo y cinematográfico.',
    badge: 'Piano 01 / 02',
    available: true,
    sort_order: 7
  },
  {
    id: 'piano-2',
    category: 'pianos',
    category_label: '2 Pianos',
    name: 'Fender Rhodes Stage 73 / Nord Stage 88',
    spec: 'Piano eléctrico de martillos reales con vibrato analógico y emulación de órganos y clavinet.',
    badge: 'Piano 02 / 02',
    available: true,
    sort_order: 8
  },
  {
    id: 'sinte-1',
    category: 'sintetizadores',
    category_label: '2 Sintetizadores',
    name: 'Sequential Prophet-6 Analógico Polifónico',
    spec: '6 voces analógicas puras para colchones armónicos, arpegios envolventes y texturas retro-futuristas.',
    badge: 'Sinte 01 / 02',
    available: true,
    sort_order: 9
  },
  {
    id: 'sinte-2',
    category: 'sintetizadores',
    category_label: '2 Sintetizadores',
    name: 'Moog Subsequent 37 Parafónico',
    spec: 'Síntesis analógica con filtro Ladder clásico para bajos profundos, leads expresivos y diseño sonoro.',
    badge: 'Sinte 02 / 02',
    available: true,
    sort_order: 10
  },
  {
    id: 'bajo-1',
    category: 'bajos',
    category_label: '2 Bajos',
    name: 'Fender Precision Bass (Cuerdas Flatwound)',
    spec: 'El estándar indiscutible de grabación con graves definidos, cálidos y presentes en cualquier mezcla.',
    badge: 'Bajo 01 / 02',
    available: true,
    sort_order: 11
  },
  {
    id: 'bajo-2',
    category: 'bajos',
    category_label: '2 Bajos',
    name: 'Höfner Violin Bass Hollowbody',
    spec: 'Escala corta y cuerpo hueco para líneas melódicas con ataque de madera vintage.',
    badge: 'Bajo 02 / 02',
    available: true,
    sort_order: 12
  },
  {
    id: 'microfono-1',
    category: 'microfonos',
    category_label: '2 Micrófonos Estelares',
    name: 'Neumann U87 Ai Condensador Multi-Patrón',
    spec: 'Referencia mundial para captura vocal detallada, cuerdas y ambiente de sala.',
    badge: 'Mic 01 / 02',
    available: true,
    sort_order: 13
  },
  {
    id: 'microfono-2',
    category: 'microfonos',
    category_label: '2 Micrófonos Estelares',
    name: 'Shure SM7B Dinámico + Coles 4038 Ribbon',
    spec: 'Dúo versátil para voces cercanas sin reflexión de cuarto y captura sedosa de instrumentos.',
    badge: 'Mic 02 / 02',
    available: true,
    sort_order: 14
  },
  {
    id: 'daw-1',
    category: 'software',
    category_label: '2 Entornos DAW',
    name: 'Ableton Live 12 Suite + Push',
    spec: 'Estación creativa configurada para maquetación veloz, live looping y composición no lineal.',
    badge: 'DAW 01 / 02',
    available: true,
    sort_order: 15
  },
  {
    id: 'daw-2',
    category: 'software',
    category_label: '2 Entornos DAW',
    name: 'Logic Pro X & Pro Tools Studio',
    spec: 'Grabación multipista de baja latencia con colección completa de plugins de mezcla y efectos.',
    badge: 'DAW 02 / 02',
    available: true,
    sort_order: 16
  }
];

export function formatMxn(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function formatHourLabel(hour) {
  const h = Number(hour);
  const normalized = ((h % 24) + 24) % 24;
  const suffix = normalized >= 12 ? 'PM' : 'AM';
  const twelve = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${String(normalized).padStart(2, '0')}:00 (${twelve}:00 ${suffix})`;
}
