/**
 * Seed de perfiles demo — 3 artistas + 3 eventos con datos reales y completos
 * Ejecutar: npx tsx scripts/seed-demo-profiles.ts
 */

import { db } from '../src/db';
import { users, artists, categories, disciplines, roles } from '../src/schema';
import { events } from '../src/schema/events';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Helper: buscar un registro por nombre (insensible a mayúsculas)
// ---------------------------------------------------------------------------
function findByName<T extends { id: number; name: string }>(list: T[], name: string): T | undefined {
  return list.find(x => x.name.toLowerCase().includes(name.toLowerCase()));
}

async function seedDemoProfiles() {
  console.log('\n🌱  Iniciando seed de perfiles demo...\n');

  // ── Cargar jerarquía ──────────────────────────────────────────────────────
  const allCategories  = await db.select().from(categories)  as any[];
  const allDisciplines = await db.select().from(disciplines) as any[];
  const allRoles       = await db.select().from(roles)       as any[];

  console.log(`📋  Categorías: ${allCategories.length} | Disciplinas: ${allDisciplines.length} | Roles: ${allRoles.length}`);

  // Buscar IDs por nombre (si no existen en la BD, quedan null — el perfil igual se crea)
  const catMusica   = findByName(allCategories,  'Música');
  const catVisual   = findByName(allCategories,  'Visual') || findByName(allCategories, 'Artes Visuales');
  const catEscenica = findByName(allCategories,  'Escénica') || findByName(allCategories, 'Artes Escénicas') || findByName(allCategories, 'Teatro');

  const discVocal  = findByName(allDisciplines, 'Vocal') || findByName(allDisciplines, 'Canto');
  const discFoto   = findByName(allDisciplines, 'Fotografía') || findByName(allDisciplines, 'Foto');
  const discDanza  = findByName(allDisciplines, 'Danza') || findByName(allDisciplines, 'Baile');

  const roleCantante  = findByName(allRoles, 'Cantante') || findByName(allRoles, 'Vocalista') || allRoles[0];
  const roleFotografo = findByName(allRoles, 'Fotógrafo') || findByName(allRoles, 'Fotografo') || allRoles[1] || allRoles[0];
  const roleBailarín  = findByName(allRoles, 'Bailarín') || findByName(allRoles, 'Bailarin') || findByName(allRoles, 'Danzante') || allRoles[2] || allRoles[0];

  console.log(`\n🔍  IDs resueltos:`);
  console.log(`   Música     → cat:${catMusica?.id}  disc:${discVocal?.id}  rol:${roleCantante?.id}`);
  console.log(`   Fotografía → cat:${catVisual?.id}  disc:${discFoto?.id}   rol:${roleFotografo?.id}`);
  console.log(`   Danza      → cat:${catEscenica?.id} disc:${discDanza?.id}  rol:${roleBailarín?.id}\n`);

  const password = await bcrypt.hash('Demo2026!', 10);

  // ==========================================================================
  // ARTISTA 1 — Valeria Montoya | Cantautora Pop
  // ==========================================================================
  const VALERIA_ID = 'demo_valeria_montoya_001';
  const valariaExists = await db.select({ id: users.id }).from(users).where(eq(users.id, VALERIA_ID)).limit(1);

  if (valariaExists.length === 0) {
    await db.insert(users).values({
      id: VALERIA_ID,
      email: 'valeria.montoya@demo.artistasapp.co',
      password,
      firstName: 'Valeria',
      lastName: 'Montoya',
      displayName: 'Valeria Montoya',
      username: 'valeriam_musica',
      profileImageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80',
      userType: 'artist',
      bio: 'Cantautora colombiana con alma pop y raíces folklóricas. Ocho años transformando emociones en canciones que conectan con el corazón de las personas.',
      city: 'Medellín',
      phone: '+57 314 820 9931',
      website: 'https://valeriamontoya.co',
      socialMedia: {
        instagram: '@valeriam_musica',
        youtube: 'Valeria Montoya Oficial',
        spotify: 'Valeria Montoya',
        tiktok: '@valeriam_music',
      },
      isVerified: true,
      isFeatured: true,
      isAvailable: true,
      rating: '4.90',
      totalReviews: 47,
      fanCount: 1250,
      emailVerified: true,
      onboardingCompleted: true,
    });

    await db.insert(artists).values({
      userId: VALERIA_ID,
      artistName: 'Valeria Montoya',
      stageName: null,
      categoryId:   catMusica?.id   ?? null,
      disciplineId: discVocal?.id   ?? null,
      roleId:       roleCantante?.id ?? null,
      tags: ['Cantautora', 'Pop', 'Balada', 'Folklore', 'Medellín', 'Profesional', 'Live', 'Songwriter'],
      subcategories: ['Pop Latino', 'Balada', 'Fusión Folklórica'],
      artistType: 'solo',
      presentationType: ['En vivo', 'Online', 'Grabado'],
      serviceTypes: ['Shows', 'Eventos', 'Corporativo', 'Talleres', 'Grabación'],
      description:
        'Valeria Montoya es una cantautora con base en Medellín, Colombia, con 8 años de trayectoria en la industria musical. ' +
        'Su sonido fusiona el pop contemporáneo con elementos del folklore andino colombiano, creando una propuesta única que ' +
        'ha conquistado escenarios en más de 12 ciudades del país.\n\n' +
        'Ha lanzado dos EP independientes — "Raíces" (2021) y "Latidos" (2023) — con un total de más de 2 millones de streams ' +
        'en plataformas digitales. Ha abierto conciertos para artistas nacionales de talla como Monsieur Periné y Diamante Eléctrico.\n\n' +
        'Ofrece presentaciones en vivo de 45 a 90 minutos con banda completa o formato acústico. También imparte talleres de ' +
        'composición y técnica vocal para grupos de hasta 20 personas. Disponible para eventos corporativos, bodas, festivales y giras.',
      bio:
        'Cantautora con 8 años de experiencia. Fusiona pop con folklore colombiano. ' +
        'Dos EP lanzados, más de 2M de streams. Disponible para shows, corporativos y talleres.',
      yearsOfExperience: 8,
      experience: 3,
      baseCity: 'Medellín',
      travelAvailability: true,
      travelDistance: 400,
      isAvailable: true,
      isVerified: true,
      isProfileComplete: true,
      pricePerHour: '180000',
      priceRange: { min: 800000, max: 3500000, currency: 'COP' },
      rating: '4.90',
      totalReviews: 47,
      fanCount: 1250,
      viewCount: 3840,
      socialMedia: {
        instagram: '@valeriam_musica',
        youtube: 'Valeria Montoya Oficial',
        spotify: 'Valeria Montoya',
        tiktok: '@valeriam_music',
      },
      gallery: [
        'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800',
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
        'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
      ],
      portfolio: {
        bio_video: 'https://www.youtube.com/watch?v=example_valeria',
        highlights: ['EP Raíces 2021', 'EP Latidos 2023', 'Festival Estéreo Picnic 2024'],
      },
      availability: {
        monday: true, tuesday: true, wednesday: true,
        thursday: true, friday: true, saturday: true, sunday: false,
      },
      education: [
        {
          institution: 'Conservatorio de Música Universidad de Antioquia',
          degree: 'Licenciatura en Canto Lírico y Popular',
          year: 2018,
          description: 'Énfasis en canto popular y técnica vocal contemporánea',
        },
        {
          institution: 'Berklee Online',
          degree: 'Certificación en Producción y Composición Musical',
          year: 2020,
          description: 'Especialización en songwriting y producción vocal',
        },
      ],
      services: [
        {
          id: 'val_svc_1',
          name: 'Show en vivo (banda completa)',
          description: 'Presentación de 60-90 min con banda de 4 músicos. Repertorio propio y versiones.',
          price: 2200000,
          duration: '90 min',
          category: 'show',
        },
        {
          id: 'val_svc_2',
          name: 'Show acústico',
          description: 'Formato dúo guitarra + voz. Ideal para eventos íntimos y corporativos.',
          price: 900000,
          duration: '60 min',
          category: 'show',
        },
        {
          id: 'val_svc_3',
          name: 'Taller de composición vocal',
          description: 'Taller grupal de songwriting y técnica vocal. Máximo 15 personas.',
          price: 250000,
          duration: '3 horas',
          category: 'taller',
        },
      ],
      metadata: {
        role: 'Cantante',
        discipline: 'Música Vocal',
        category: 'Música',
        specialization: 'Pop / Balada',
      },
      customStats: {
        rol_principal: 'Cantante / Cantautora',
        disciplina: 'Música Vocal',
        categoria: 'Música',
        especializacion: 'Pop Latino y Folklore',
        años_experiencia: 8,
        nivel: 'Profesional',
        proyectos_completados: 124,
        tiempo_respuesta: '2 horas',
        idiomas: ['Español', 'Inglés'],
      },
    });

    console.log('✅  Artista 1 creado: Valeria Montoya (Cantautora Pop)');
  } else {
    console.log('⏭️   Artista 1 ya existe: Valeria Montoya');
  }

  // ==========================================================================
  // ARTISTA 2 — Santiago Reyes | Fotógrafo de Arte y Retrato
  // ==========================================================================
  const SANTIAGO_ID = 'demo_santiago_reyes_002';
  const santiagoExists = await db.select({ id: users.id }).from(users).where(eq(users.id, SANTIAGO_ID)).limit(1);

  if (santiagoExists.length === 0) {
    await db.insert(users).values({
      id: SANTIAGO_ID,
      email: 'santiago.reyes@demo.artistasapp.co',
      password,
      firstName: 'Santiago',
      lastName: 'Reyes',
      displayName: 'Santiago Reyes',
      username: 'santiagoreyes_photo',
      profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
      userType: 'artist',
      bio: 'Fotógrafo de retrato y arte editorial con 6 años de experiencia. Especialista en contar historias a través de la imagen.',
      city: 'Bogotá',
      phone: '+57 310 754 1820',
      website: 'https://santiagoreyes.photo',
      socialMedia: {
        instagram: '@santiagoreyes_photo',
        behance: 'santiagoreyes',
        linkedin: 'santiago-reyes-foto',
      },
      isVerified: true,
      isFeatured: false,
      isAvailable: true,
      rating: '4.80',
      totalReviews: 38,
      fanCount: 760,
      emailVerified: true,
      onboardingCompleted: true,
    });

    await db.insert(artists).values({
      userId: SANTIAGO_ID,
      artistName: 'Santiago Reyes',
      stageName: null,
      categoryId:   catVisual?.id    ?? null,
      disciplineId: discFoto?.id     ?? null,
      roleId:       roleFotografo?.id ?? null,
      tags: ['Fotografía', 'Retrato', 'Editorial', 'Arte', 'Bogotá', 'Profesional', 'Documental'],
      subcategories: ['Retrato Artístico', 'Fotografía Editorial', 'Fotografía Documental'],
      artistType: 'solo',
      presentationType: ['Presencial', 'Online'],
      serviceTypes: ['Sesiones fotográficas', 'Eventos', 'Corporativo', 'Editorial'],
      description:
        'Santiago Reyes es un fotógrafo profesional bogotano con 6 años de experiencia especializado en retrato artístico, ' +
        'fotografía editorial y documentación cultural. Su trabajo ha sido publicado en medios como Revista Semana, El Tiempo ' +
        'y varias publicaciones internacionales de arte.\n\n' +
        'Trabaja tanto en estudio propio en Bogotá como en locación en todo el territorio nacional. Su estilo mezcla ' +
        'la iluminación natural con técnicas de iluminación de estudio para lograr imágenes que combinan autenticidad y ' +
        'estética contemporánea.\n\n' +
        'Sus servicios incluyen sesiones de retrato individual y grupal, fotografía de producto y arte, cobertura de eventos ' +
        'culturales y corporativos, y consultoría de imagen para artistas y marcas creativas. Entrega las fotografías ' +
        'editadas en formato RAW y JPG con licencia de uso comercial incluida.',
      bio:
        'Fotógrafo de retrato y editorial con 6 años de trayectoria. Publicado en Semana y El Tiempo. ' +
        'Especialista en fotografía artística y cobertura de eventos culturales.',
      yearsOfExperience: 6,
      experience: 3,
      baseCity: 'Bogotá',
      travelAvailability: true,
      travelDistance: 300,
      isAvailable: true,
      isVerified: true,
      isProfileComplete: true,
      pricePerHour: '220000',
      priceRange: { min: 500000, max: 4000000, currency: 'COP' },
      rating: '4.80',
      totalReviews: 38,
      fanCount: 760,
      viewCount: 2100,
      socialMedia: {
        instagram: '@santiagoreyes_photo',
        behance: 'santiagoreyes',
        linkedin: 'santiago-reyes-foto',
      },
      gallery: [
        'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800',
        'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800',
        'https://images.unsplash.com/photo-1461532257246-777de18cd58b?w=800',
        'https://images.unsplash.com/photo-1604537466608-109fa2f16c3b?w=800',
        'https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?w=800',
      ],
      portfolio: {
        bio_video: null,
        highlights: ['Portada Revista Semana 2023', 'Exposición Fotográfica MAMBO 2024', 'Campaña Artbo 2024'],
      },
      availability: {
        monday: true, tuesday: true, wednesday: true,
        thursday: true, friday: true, saturday: true, sunday: true,
      },
      education: [
        {
          institution: 'Universidad de los Andes',
          degree: 'Pregrado en Artes con énfasis en Imagen',
          year: 2020,
          description: 'Tesis sobre fotografía documental y memoria cultural',
        },
        {
          institution: 'ICP — International Center of Photography (Online)',
          degree: 'Diplomado en Fotografía de Retrato',
          year: 2021,
          description: 'Técnicas avanzadas de iluminación y composición',
        },
      ],
      services: [
        {
          id: 'san_svc_1',
          name: 'Sesión de retrato artístico',
          description: 'Sesión de 2 horas en estudio o locación. Incluye 20 fotos editadas en alta resolución.',
          price: 480000,
          duration: '2 horas',
          category: 'sesion',
        },
        {
          id: 'san_svc_2',
          name: 'Cobertura de evento cultural',
          description: 'Cobertura completa de eventos con entrega del mismo día. Incluye más de 100 fotos editadas.',
          price: 1200000,
          duration: '6 horas',
          category: 'evento',
        },
        {
          id: 'san_svc_3',
          name: 'Fotografía editorial para artistas',
          description: 'Sesión editorial completa para artistas: fotos de prensa, EPK y redes sociales.',
          price: 900000,
          duration: '4 horas',
          category: 'editorial',
        },
      ],
      metadata: {
        role: 'Fotógrafo',
        discipline: 'Fotografía',
        category: 'Artes Visuales',
        specialization: 'Retrato Artístico',
      },
      customStats: {
        rol_principal: 'Fotógrafo',
        disciplina: 'Fotografía de Retrato y Editorial',
        categoria: 'Artes Visuales',
        especializacion: 'Retrato Artístico',
        años_experiencia: 6,
        nivel: 'Profesional',
        proyectos_completados: 89,
        tiempo_respuesta: '1 hora',
        idiomas: ['Español', 'Inglés'],
      },
    });

    console.log('✅  Artista 2 creado: Santiago Reyes (Fotógrafo)');
  } else {
    console.log('⏭️   Artista 2 ya existe: Santiago Reyes');
  }

  // ==========================================================================
  // ARTISTA 3 — Luna Vargas | Bailarina y Coreógrafa
  // ==========================================================================
  const LUNA_ID = 'demo_luna_vargas_003';
  const lunaExists = await db.select({ id: users.id }).from(users).where(eq(users.id, LUNA_ID)).limit(1);

  if (lunaExists.length === 0) {
    await db.insert(users).values({
      id: LUNA_ID,
      email: 'luna.vargas@demo.artistasapp.co',
      password,
      firstName: 'Luna',
      lastName: 'Vargas',
      displayName: 'Luna Vargas',
      username: 'luna_danza',
      profileImageUrl: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&q=80',
      userType: 'artist',
      bio: 'Bailarina y coreógrafa con 10 años de experiencia en danza contemporánea y fusión. Cuerpo, emoción y espacio en diálogo constante.',
      city: 'Cali',
      phone: '+57 316 401 7752',
      website: 'https://lunavargasdanza.com',
      socialMedia: {
        instagram: '@luna_danza',
        youtube: 'Luna Vargas Danza',
        tiktok: '@luna_danza_co',
      },
      isVerified: true,
      isFeatured: true,
      isAvailable: true,
      rating: '4.95',
      totalReviews: 62,
      fanCount: 2100,
      emailVerified: true,
      onboardingCompleted: true,
    });

    await db.insert(artists).values({
      userId: LUNA_ID,
      artistName: 'Luna Vargas',
      stageName: null,
      categoryId:   catEscenica?.id  ?? null,
      disciplineId: discDanza?.id    ?? null,
      roleId:       roleBailarín?.id  ?? null,
      tags: ['Danza Contemporánea', 'Coreografía', 'Fusión', 'Cali', 'Artes Escénicas', 'Experta'],
      subcategories: ['Danza Contemporánea', 'Danza Urbana', 'Performance'],
      artistType: 'solo',
      presentationType: ['En vivo', 'Online'],
      serviceTypes: ['Shows', 'Eventos', 'Talleres', 'Corporativo', 'Coreografía'],
      description:
        'Luna Vargas es bailarina, coreógrafa e investigadora de movimiento con sede en Cali, Colombia. ' +
        'Con 10 años de carrera, ha desarrollado un lenguaje coreográfico propio que dialoga entre la danza contemporánea, ' +
        'la tradición de las danzas colombianas y las tendencias urbanas internacionales.\n\n' +
        'Ha representado a Colombia en festivales internacionales en México, Argentina, España y Francia. ' +
        'Dirige su propia compañía de danza "Cuerpos en Diálogo" y lidera el taller permanente de danza contemporánea ' +
        'en el Centro Cultural de Cali.\n\n' +
        'Sus servicios abarcan presentaciones en solitario y con compañía (2-8 bailarines), talleres de danza contemporánea ' +
        'y movimiento consciente, diseño coreográfico para eventos, videoclips y publicidad, y conferencias-performance ' +
        'sobre el cuerpo y la identidad cultural colombiana.',
      bio:
        'Bailarina y coreógrafa con 10 años de experiencia. Directora de "Cuerpos en Diálogo". ' +
        'Representante de Colombia en festivales internacionales. Talleres, shows y coreografías a medida.',
      yearsOfExperience: 10,
      experience: 4,
      baseCity: 'Cali',
      travelAvailability: true,
      travelDistance: 500,
      isAvailable: true,
      isVerified: true,
      isProfileComplete: true,
      pricePerHour: '250000',
      priceRange: { min: 1200000, max: 8000000, currency: 'COP' },
      rating: '4.95',
      totalReviews: 62,
      fanCount: 2100,
      viewCount: 5620,
      socialMedia: {
        instagram: '@luna_danza',
        youtube: 'Luna Vargas Danza',
        tiktok: '@luna_danza_co',
      },
      gallery: [
        'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800',
        'https://images.unsplash.com/photo-1545959570-a94084071b5d?w=800',
        'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800',
        'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=800',
        'https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=800',
      ],
      portfolio: {
        bio_video: 'https://www.youtube.com/watch?v=example_luna',
        highlights: ['Festival FIT Cali 2023', 'Festival Internacional de Danza Madrid 2024', 'TED Cali 2023'],
      },
      availability: {
        monday: true, tuesday: true, wednesday: false,
        thursday: true, friday: true, saturday: true, sunday: false,
      },
      education: [
        {
          institution: 'Instituto Popular de Cultura — Cali',
          degree: 'Técnico en Danza y Movimiento',
          year: 2016,
          description: 'Especialización en danza contemporánea y coreografía',
        },
        {
          institution: 'École des Sables — Dakar, Senegal',
          degree: 'Residencia artística en Danza Contemporánea Africana',
          year: 2019,
          description: 'Investigación en danza y cuerpo como memoria cultural',
        },
        {
          institution: 'Certificación en Movimiento Somático (Continuum Movement)',
          degree: 'Certificación Profesional',
          year: 2022,
          description: 'Técnicas de movimiento consciente y terapia de movimiento',
        },
      ],
      services: [
        {
          id: 'luna_svc_1',
          name: 'Performance en solitario',
          description: 'Pieza de danza contemporánea de 20-40 min. Incluye diseño de luces básico.',
          price: 1500000,
          duration: '40 min',
          category: 'show',
        },
        {
          id: 'luna_svc_2',
          name: 'Show compañía (4-8 bailarines)',
          description: 'Presentación con compañía Cuerpos en Diálogo. 60-90 minutos.',
          price: 5500000,
          duration: '90 min',
          category: 'show',
        },
        {
          id: 'luna_svc_3',
          name: 'Taller de danza contemporánea',
          description: 'Taller intensivo de movimiento consciente y expresión corporal. Grupos de 8-20 personas.',
          price: 350000,
          duration: '3 horas',
          category: 'taller',
        },
        {
          id: 'luna_svc_4',
          name: 'Diseño coreográfico',
          description: 'Coreografía a medida para videos, eventos o publicidad. Incluye ensayos y dirección.',
          price: 2800000,
          duration: 'Según proyecto',
          category: 'coreografia',
        },
      ],
      metadata: {
        role: 'Bailarina',
        discipline: 'Danza',
        category: 'Artes Escénicas',
        specialization: 'Danza Contemporánea',
      },
      customStats: {
        rol_principal: 'Bailarina / Coreógrafa',
        disciplina: 'Danza Contemporánea',
        categoria: 'Artes Escénicas',
        especializacion: 'Performance y Fusión',
        años_experiencia: 10,
        nivel: 'Experta',
        proyectos_completados: 198,
        tiempo_respuesta: '3 horas',
        idiomas: ['Español', 'Francés', 'Inglés'],
      },
    });

    console.log('✅  Artista 3 creado: Luna Vargas (Bailarina / Coreógrafa)');
  } else {
    console.log('⏭️   Artista 3 ya existe: Luna Vargas');
  }

  // ==========================================================================
  // EVENTOS — 3 eventos con datos completos (fechas 2026)
  // ==========================================================================

  // Usar el primer usuario real disponible como organizador (fallback a Valeria si todo falla)
  const firstUser = await db.select({ id: users.id }).from(users).limit(1);
  const organizerId = firstUser[0]?.id ?? VALERIA_ID;

  const demoEvents = [
    {
      slug: 'festival-vibra-colombia-2026',
      organizerId,
      title: 'Festival Vibra Colombia 2026',
      description:
        'El festival de música más esperado del año vuelve a Bogotá con una línea artística que celebra lo mejor de la escena ' +
        'colombiana e internacional. Tres días de conciertos en escenarios simultáneos, experiencias gastronómicas, ' +
        'mercado de artesanías y zonas de activaciones interactivas.\n\n' +
        'Artistas confirmados incluyen nombres del pop, el reggaetón alternativo, el jazz fusión y el rock indie. ' +
        'El festival tiene sello de carbono neutro y cuenta con el apoyo del Ministerio de Cultura.',
      shortDescription: 'El festival de música más esperado del año regresa a Bogotá. Tres días, varios escenarios, artistas nacionales e internacionales.',
      eventType: 'festival',
      startDate: new Date('2026-05-15T16:00:00'),
      endDate:   new Date('2026-05-17T23:59:00'),
      locationType: 'physical',
      address: 'Parque Simón Bolívar, Cra. 60 #63-20',
      city: 'Bogotá',
      country: 'Colombia',
      venueName: 'Parque Simón Bolívar',
      capacity: 80000,
      availableTickets: 45000,
      ticketPrice: '180000',
      isFree: false,
      status: 'published',
      featuredImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
      ],
      tags: ['festival', 'música', 'pop', 'jazz', 'rock', 'bogotá', 'al aire libre'],
      isFeatured: true,
      isVerified: true,
      viewCount: 18420,
      saveCount: 4230,
      shareCount: 2810,
    },
    {
      slug: 'taller-acuarela-expresionista-medellin-2026',
      organizerId,
      title: 'Taller de Acuarela Expresionista',
      description:
        'Un taller intensivo de un día diseñado para artistas intermedios y avanzados que quieren dominar la acuarela ' +
        'desde una perspectiva expresionista. Trabajaremos con la gestualidad, la mancha y el color como lenguaje emocional.\n\n' +
        'El taller incluye todos los materiales (papeles de alta gramaje, pigmentos profesionales, pinceles), ' +
        'guía de técnicas en PDF, coffee break y una sesión de retroalimentación grupal al final del día.\n\n' +
        'Cupos muy limitados para garantizar atención personalizada. Dictado por la artista plástica Ana Lucía Bernal, ' +
        'ganadora del Premio Nacional de Arte 2022.',
      shortDescription: 'Aprende acuarela expresionista con la artista Ana Lucía Bernal. Materiales incluidos, cupos limitados a 12 personas.',
      eventType: 'workshop',
      startDate: new Date('2026-04-20T09:00:00'),
      endDate:   new Date('2026-04-20T18:00:00'),
      locationType: 'physical',
      address: 'El Poblado, Calle 10A #43D-55',
      city: 'Medellín',
      country: 'Colombia',
      venueName: 'Estudio Arte & Proceso',
      capacity: 12,
      availableTickets: 4,
      ticketPrice: '95000',
      isFree: false,
      status: 'published',
      featuredImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1574169208507-84376144848b?w=800',
        'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=800',
        'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
      ],
      tags: ['taller', 'acuarela', 'artes plásticas', 'expresionismo', 'medellín', 'pintura'],
      isFeatured: false,
      isVerified: true,
      viewCount: 2340,
      saveCount: 478,
      shareCount: 134,
    },
    {
      slug: 'noche-danza-contemporanea-cali-2026',
      organizerId,
      title: 'Noche de Danza Contemporánea: Cuerpos en Diálogo',
      description:
        'Una velada excepcional donde el movimiento y la emoción conversan en el escenario. La compañía "Cuerpos en Diálogo" ' +
        'presenta su programa de temporada 2026 con tres piezas inéditas que exploran la identidad, la memoria y ' +
        'la transformación del cuerpo en el tiempo.\n\n' +
        '"Raíz" — pieza para cuatro bailarines que indaga en las tradiciones corporales colombianas.\n' +
        '"Latencia" — solo coreográfico de Luna Vargas sobre el cuerpo en espera.\n' +
        '"Contacto" — dúo que explora el encuentro y la resistencia entre dos cuerpos.\n\n' +
        'El programa incluye un conversatorio post-función con las bailarinas y el equipo creativo.',
      shortDescription: 'Tres piezas de danza contemporánea de la compañía Cuerpos en Diálogo. Conversatorio incluido post-función.',
      eventType: 'performance',
      startDate: new Date('2026-04-25T19:30:00'),
      endDate:   new Date('2026-04-25T22:00:00'),
      locationType: 'physical',
      address: 'Calle 7 Norte #8N-51',
      city: 'Cali',
      country: 'Colombia',
      venueName: 'Teatro Experimental de Cali',
      capacity: 180,
      availableTickets: 67,
      ticketPrice: '65000',
      isFree: false,
      status: 'published',
      featuredImage: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1545959570-a94084071b5d?w=800',
        'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=800',
        'https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=800',
      ],
      tags: ['danza', 'danza contemporánea', 'teatro', 'performance', 'cali', 'artes escénicas'],
      isFeatured: true,
      isVerified: true,
      viewCount: 5890,
      saveCount: 1240,
      shareCount: 670,
    },
  ];

  console.log('\n📅  Creando eventos demo...\n');

  for (const evt of demoEvents) {
    const existing = await db.select({ id: events.id }).from(events).where(eq(events.slug, evt.slug)).limit(1);

    if (existing.length > 0) {
      console.log(`⏭️   Evento ya existe: ${evt.title}`);
      continue;
    }

    await db.insert(events).values(evt as any);
    console.log(`✅  Evento creado: ${evt.title}`);
  }

  // ── Resumen final ─────────────────────────────────────────────────────────
  console.log('\n🎉  Seed demo completado!\n');
  console.log('🔑  Credenciales de los artistas demo:');
  console.log('   valeria.montoya@demo.artistasapp.co  →  Demo2026!');
  console.log('   santiago.reyes@demo.artistasapp.co   →  Demo2026!');
  console.log('   luna.vargas@demo.artistasapp.co      →  Demo2026!\n');

  process.exit(0);
}

seedDemoProfiles().catch(err => {
  console.error('❌  Error durante el seed demo:', err);
  process.exit(1);
});
