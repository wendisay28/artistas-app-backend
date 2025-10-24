-- Script complementario para poblar categorías 3-7
-- Ejecutar DESPUÉS del primer script
-- Ejecutar en Neon SQL Editor

-- ============================================================
-- CATEGORÍA 3: MEDIOS AUDIOVISUALES
-- ============================================================

-- Disciplinas de Medios Audiovisuales
INSERT INTO disciplines (code, name, category_id) VALUES
('cine', 'Cine', 3),
('television', 'Televisión', 3),
('radio', 'Radio', 3),
('streaming', 'Streaming', 3),
('podcast', 'Podcast', 3),
('animacion', 'Animación', 3),
('doblaje', 'Doblaje', 3),
('locucion', 'Locución', 3),
('videoarte', 'Videoarte', 3);

-- Roles: Cine
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('actor-cine', 'Actor de Cine', (SELECT id FROM disciplines WHERE code = 'cine'), 3),
('director-cine', 'Director de Cine', (SELECT id FROM disciplines WHERE code = 'cine'), 3);

-- Especializaciones: Actor de Cine
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('principal', 'Actor principal', (SELECT id FROM roles WHERE code = 'actor-cine'), (SELECT id FROM disciplines WHERE code = 'cine'), 3),
('reparto', 'Actor de reparto', (SELECT id FROM roles WHERE code = 'actor-cine'), (SELECT id FROM disciplines WHERE code = 'cine'), 3),
('doble', 'Doble de acción', (SELECT id FROM roles WHERE code = 'actor-cine'), (SELECT id FROM disciplines WHERE code = 'cine'), 3);

-- Especializaciones: Director de Cine
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('ficcion', 'Ficción', (SELECT id FROM roles WHERE code = 'director-cine'), (SELECT id FROM disciplines WHERE code = 'cine'), 3),
('documental', 'Documental', (SELECT id FROM roles WHERE code = 'director-cine'), (SELECT id FROM disciplines WHERE code = 'cine'), 3),
('cortometraje', 'Cortometraje', (SELECT id FROM roles WHERE code = 'director-cine'), (SELECT id FROM disciplines WHERE code = 'cine'), 3);

-- Roles: Televisión
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('presentador-tv', 'Presentador de Televisión', (SELECT id FROM disciplines WHERE code = 'television'), 3),
('actor-tv', 'Actor de Televisión', (SELECT id FROM disciplines WHERE code = 'television'), 3);

-- Especializaciones: Presentador TV
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('noticias', 'Noticias', (SELECT id FROM roles WHERE code = 'presentador-tv'), (SELECT id FROM disciplines WHERE code = 'television'), 3),
('entretenimiento', 'Entretenimiento', (SELECT id FROM roles WHERE code = 'presentador-tv'), (SELECT id FROM disciplines WHERE code = 'television'), 3),
('deportes-tv', 'Deportes', (SELECT id FROM roles WHERE code = 'presentador-tv'), (SELECT id FROM disciplines WHERE code = 'television'), 3);

-- Especializaciones: Actor TV
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('telenovela', 'Telenovela', (SELECT id FROM roles WHERE code = 'actor-tv'), (SELECT id FROM disciplines WHERE code = 'television'), 3),
('serie', 'Serie', (SELECT id FROM roles WHERE code = 'actor-tv'), (SELECT id FROM disciplines WHERE code = 'television'), 3),
('comercial-tv', 'Comercial', (SELECT id FROM roles WHERE code = 'actor-tv'), (SELECT id FROM disciplines WHERE code = 'television'), 3);

-- Roles: Radio
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('locutor', 'Locutor', (SELECT id FROM disciplines WHERE code = 'radio'), 3);

-- Especializaciones: Locutor
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('musical-radio', 'Musical', (SELECT id FROM roles WHERE code = 'locutor'), (SELECT id FROM disciplines WHERE code = 'radio'), 3),
('noticias-radio', 'Noticias', (SELECT id FROM roles WHERE code = 'locutor'), (SELECT id FROM disciplines WHERE code = 'radio'), 3),
('deportes-radio', 'Deportes', (SELECT id FROM roles WHERE code = 'locutor'), (SELECT id FROM disciplines WHERE code = 'radio'), 3);

-- Roles: Streaming
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('streamer', 'Streamer', (SELECT id FROM disciplines WHERE code = 'streaming'), 3);

-- Especializaciones: Streamer
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('gaming', 'Gaming', (SELECT id FROM roles WHERE code = 'streamer'), (SELECT id FROM disciplines WHERE code = 'streaming'), 3),
('musica-stream', 'Música', (SELECT id FROM roles WHERE code = 'streamer'), (SELECT id FROM disciplines WHERE code = 'streaming'), 3),
('contenido-general', 'Contenido general', (SELECT id FROM roles WHERE code = 'streamer'), (SELECT id FROM disciplines WHERE code = 'streaming'), 3);

-- Roles: Podcast
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('podcaster', 'Podcaster', (SELECT id FROM disciplines WHERE code = 'podcast'), 3);

-- Especializaciones: Podcaster
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('entrevistas', 'Entrevistas', (SELECT id FROM roles WHERE code = 'podcaster'), (SELECT id FROM disciplines WHERE code = 'podcast'), 3),
('narrativa', 'Narrativa', (SELECT id FROM roles WHERE code = 'podcaster'), (SELECT id FROM disciplines WHERE code = 'podcast'), 3),
('educativo', 'Educativo', (SELECT id FROM roles WHERE code = 'podcaster'), (SELECT id FROM disciplines WHERE code = 'podcast'), 3);

-- Roles: Animación
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('animador', 'Animador', (SELECT id FROM disciplines WHERE code = 'animacion'), 3);

-- Especializaciones: Animador
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('2d', 'Animación 2D', (SELECT id FROM roles WHERE code = 'animador'), (SELECT id FROM disciplines WHERE code = 'animacion'), 3),
('3d', 'Animación 3D', (SELECT id FROM roles WHERE code = 'animador'), (SELECT id FROM disciplines WHERE code = 'animacion'), 3),
('motion-capture', 'Motion capture', (SELECT id FROM roles WHERE code = 'animador'), (SELECT id FROM disciplines WHERE code = 'animacion'), 3);

-- Roles: Doblaje
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('actor-doblaje', 'Actor de Doblaje', (SELECT id FROM disciplines WHERE code = 'doblaje'), 3);

-- Especializaciones: Actor de Doblaje
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('cine-doblaje', 'Cine', (SELECT id FROM roles WHERE code = 'actor-doblaje'), (SELECT id FROM disciplines WHERE code = 'doblaje'), 3),
('videojuegos', 'Videojuegos', (SELECT id FROM roles WHERE code = 'actor-doblaje'), (SELECT id FROM disciplines WHERE code = 'doblaje'), 3),
('comerciales-doblaje', 'Comerciales', (SELECT id FROM roles WHERE code = 'actor-doblaje'), (SELECT id FROM disciplines WHERE code = 'doblaje'), 3);

-- Roles: Locución
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('locutor-comercial', 'Locutor', (SELECT id FROM disciplines WHERE code = 'locucion'), 3);

-- Especializaciones: Locutor Comercial
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('comercial-locucion', 'Comercial', (SELECT id FROM roles WHERE code = 'locutor-comercial'), (SELECT id FROM disciplines WHERE code = 'locucion'), 3),
('institucional', 'Institucional', (SELECT id FROM roles WHERE code = 'locutor-comercial'), (SELECT id FROM disciplines WHERE code = 'locucion'), 3),
('voz-off', 'Voz en off', (SELECT id FROM roles WHERE code = 'locutor-comercial'), (SELECT id FROM disciplines WHERE code = 'locucion'), 3);

-- Roles: Videoarte
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('videoartista', 'Videoartista', (SELECT id FROM disciplines WHERE code = 'videoarte'), 3);

-- Especializaciones: Videoartista
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('experimental-video', 'Experimental', (SELECT id FROM roles WHERE code = 'videoartista'), (SELECT id FROM disciplines WHERE code = 'videoarte'), 3),
('instalacion', 'Instalación', (SELECT id FROM roles WHERE code = 'videoartista'), (SELECT id FROM disciplines WHERE code = 'videoarte'), 3),
('conceptual-video', 'Conceptual', (SELECT id FROM roles WHERE code = 'videoartista'), (SELECT id FROM disciplines WHERE code = 'videoarte'), 3);

-- ============================================================
-- CATEGORÍA 4: MODA Y DISEÑO
-- ============================================================

-- Disciplinas de Moda y Diseño
INSERT INTO disciplines (code, name, category_id) VALUES
('moda', 'Moda', 4),
('diseno-interiores', 'Diseño de Interiores', 4),
('arquitectura', 'Arquitectura', 4),
('diseno-producto', 'Diseño de Producto', 4),
('diseno-textil', 'Diseño Textil', 4),
('diseno-joyas', 'Diseño de Joyas', 4);

-- Roles: Moda
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('modelo', 'Modelo', (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('disenador-moda', 'Diseñador de Moda', (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('estilista', 'Estilista', (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('maquillador', 'Maquillador', (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('peluquero', 'Peluquero', (SELECT id FROM disciplines WHERE code = 'moda'), 4);

-- Especializaciones: Modelo
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('pasarela', 'Pasarela', (SELECT id FROM roles WHERE code = 'modelo'), (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('comercial-modelo', 'Comercial', (SELECT id FROM roles WHERE code = 'modelo'), (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('editorial-modelo', 'Editorial', (SELECT id FROM roles WHERE code = 'modelo'), (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('fitness', 'Fitness', (SELECT id FROM roles WHERE code = 'modelo'), (SELECT id FROM disciplines WHERE code = 'moda'), 4);

-- Especializaciones: Diseñador de Moda
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('alta-costura', 'Alta costura', (SELECT id FROM roles WHERE code = 'disenador-moda'), (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('pret-a-porter', 'Prêt-à-porter', (SELECT id FROM roles WHERE code = 'disenador-moda'), (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('streetwear', 'Streetwear', (SELECT id FROM roles WHERE code = 'disenador-moda'), (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('sostenible', 'Sostenible', (SELECT id FROM roles WHERE code = 'disenador-moda'), (SELECT id FROM disciplines WHERE code = 'moda'), 4);

-- Especializaciones: Estilista
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('personal', 'Personal', (SELECT id FROM roles WHERE code = 'estilista'), (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('editorial-estilista', 'Editorial', (SELECT id FROM roles WHERE code = 'estilista'), (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('celebridades', 'Celebridades', (SELECT id FROM roles WHERE code = 'estilista'), (SELECT id FROM disciplines WHERE code = 'moda'), 4);

-- Especializaciones: Maquillador
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('moda-maquillaje', 'Moda', (SELECT id FROM roles WHERE code = 'maquillador'), (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('novias', 'Novias', (SELECT id FROM roles WHERE code = 'maquillador'), (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('caracterizacion-maquillaje', 'Caracterización', (SELECT id FROM roles WHERE code = 'maquillador'), (SELECT id FROM disciplines WHERE code = 'moda'), 4);

-- Especializaciones: Peluquero
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('corte', 'Corte', (SELECT id FROM roles WHERE code = 'peluquero'), (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('color', 'Color', (SELECT id FROM roles WHERE code = 'peluquero'), (SELECT id FROM disciplines WHERE code = 'moda'), 4),
('peinado', 'Peinado', (SELECT id FROM roles WHERE code = 'peluquero'), (SELECT id FROM disciplines WHERE code = 'moda'), 4);

-- Roles: Diseño de Interiores
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('disenador-interiores', 'Diseñador de Interiores', (SELECT id FROM disciplines WHERE code = 'diseno-interiores'), 4),
('decorador', 'Decorador', (SELECT id FROM disciplines WHERE code = 'diseno-interiores'), 4);

-- Especializaciones: Diseñador de Interiores
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('residencial', 'Residencial', (SELECT id FROM roles WHERE code = 'disenador-interiores'), (SELECT id FROM disciplines WHERE code = 'diseno-interiores'), 4),
('comercial-interiores', 'Comercial', (SELECT id FROM roles WHERE code = 'disenador-interiores'), (SELECT id FROM disciplines WHERE code = 'diseno-interiores'), 4),
('corporativo', 'Corporativo', (SELECT id FROM roles WHERE code = 'disenador-interiores'), (SELECT id FROM disciplines WHERE code = 'diseno-interiores'), 4);

-- Especializaciones: Decorador
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('eventos-decoracion', 'Eventos', (SELECT id FROM roles WHERE code = 'decorador'), (SELECT id FROM disciplines WHERE code = 'diseno-interiores'), 4),
('escaparates', 'Escaparates', (SELECT id FROM roles WHERE code = 'decorador'), (SELECT id FROM disciplines WHERE code = 'diseno-interiores'), 4),
('hogar', 'Hogar', (SELECT id FROM roles WHERE code = 'decorador'), (SELECT id FROM disciplines WHERE code = 'diseno-interiores'), 4);

-- Roles: Arquitectura
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('arquitecto', 'Arquitecto', (SELECT id FROM disciplines WHERE code = 'arquitectura'), 4);

-- Especializaciones: Arquitecto
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('residencial-arquitectura', 'Residencial', (SELECT id FROM roles WHERE code = 'arquitecto'), (SELECT id FROM disciplines WHERE code = 'arquitectura'), 4),
('comercial-arquitectura', 'Comercial', (SELECT id FROM roles WHERE code = 'arquitecto'), (SELECT id FROM disciplines WHERE code = 'arquitectura'), 4),
('paisajismo', 'Paisajismo', (SELECT id FROM roles WHERE code = 'arquitecto'), (SELECT id FROM disciplines WHERE code = 'arquitectura'), 4);

-- Roles: Diseño de Producto
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('disenador-producto', 'Diseñador de Producto', (SELECT id FROM disciplines WHERE code = 'diseno-producto'), 4);

-- Especializaciones: Diseñador de Producto
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('industrial', 'Industrial', (SELECT id FROM roles WHERE code = 'disenador-producto'), (SELECT id FROM disciplines WHERE code = 'diseno-producto'), 4),
('digital-producto', 'Digital', (SELECT id FROM roles WHERE code = 'disenador-producto'), (SELECT id FROM disciplines WHERE code = 'diseno-producto'), 4),
('mobiliario', 'Mobiliario', (SELECT id FROM roles WHERE code = 'disenador-producto'), (SELECT id FROM disciplines WHERE code = 'diseno-producto'), 4);

-- Roles: Diseño Textil
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('disenador-textil', 'Diseñador Textil', (SELECT id FROM disciplines WHERE code = 'diseno-textil'), 4);

-- Especializaciones: Diseñador Textil
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('estampado', 'Estampado', (SELECT id FROM roles WHERE code = 'disenador-textil'), (SELECT id FROM disciplines WHERE code = 'diseno-textil'), 4),
('tejido', 'Tejido', (SELECT id FROM roles WHERE code = 'disenador-textil'), (SELECT id FROM disciplines WHERE code = 'diseno-textil'), 4),
('bordado', 'Bordado', (SELECT id FROM roles WHERE code = 'disenador-textil'), (SELECT id FROM disciplines WHERE code = 'diseno-textil'), 4);

-- Roles: Diseño de Joyas
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('joyero', 'Joyero', (SELECT id FROM disciplines WHERE code = 'diseno-joyas'), 4);

-- Especializaciones: Joyero
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('oro', 'Oro', (SELECT id FROM roles WHERE code = 'joyero'), (SELECT id FROM disciplines WHERE code = 'diseno-joyas'), 4),
('plata', 'Plata', (SELECT id FROM roles WHERE code = 'joyero'), (SELECT id FROM disciplines WHERE code = 'diseno-joyas'), 4),
('bisuteria', 'Bisutería', (SELECT id FROM roles WHERE code = 'joyero'), (SELECT id FROM disciplines WHERE code = 'diseno-joyas'), 4);

-- ============================================================
-- CATEGORÍA 5: CULTURA Y TURISMO
-- ============================================================

-- Disciplinas de Cultura y Turismo
INSERT INTO disciplines (code, name, category_id) VALUES
('turismo-cultural', 'Turismo Cultural', 5),
('narrativa-educacion', 'Narrativa y Educación', 5),
('gestion-cultural', 'Gestión Cultural', 5),
('patrimonio', 'Patrimonio', 5);

-- Roles: Turismo Cultural
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('guia-turistico', 'Guía Turístico', (SELECT id FROM disciplines WHERE code = 'turismo-cultural'), 5);

-- Especializaciones: Guía Turístico
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('museos', 'Museos', (SELECT id FROM roles WHERE code = 'guia-turistico'), (SELECT id FROM disciplines WHERE code = 'turismo-cultural'), 5),
('patrimonial', 'Patrimonial', (SELECT id FROM roles WHERE code = 'guia-turistico'), (SELECT id FROM disciplines WHERE code = 'turismo-cultural'), 5),
('arte-guia', 'Arte', (SELECT id FROM roles WHERE code = 'guia-turistico'), (SELECT id FROM disciplines WHERE code = 'turismo-cultural'), 5);

-- Roles: Narrativa y Educación
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('narrador', 'Narrador', (SELECT id FROM disciplines WHERE code = 'narrativa-educacion'), 5);

-- Especializaciones: Narrador
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('oral', 'Oral', (SELECT id FROM roles WHERE code = 'narrador'), (SELECT id FROM disciplines WHERE code = 'narrativa-educacion'), 5),
('cuentacuentos', 'Cuentacuentos', (SELECT id FROM roles WHERE code = 'narrador'), (SELECT id FROM disciplines WHERE code = 'narrativa-educacion'), 5),
('historico', 'Histórico', (SELECT id FROM roles WHERE code = 'narrador'), (SELECT id FROM disciplines WHERE code = 'narrativa-educacion'), 5);

-- Roles: Gestión Cultural
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('gestor-cultural', 'Gestor Cultural', (SELECT id FROM disciplines WHERE code = 'gestion-cultural'), 5);

-- Especializaciones: Gestor Cultural
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('curaduria', 'Curaduría', (SELECT id FROM roles WHERE code = 'gestor-cultural'), (SELECT id FROM disciplines WHERE code = 'gestion-cultural'), 5),
('produccion-cultural', 'Producción', (SELECT id FROM roles WHERE code = 'gestor-cultural'), (SELECT id FROM disciplines WHERE code = 'gestion-cultural'), 5),
('coordinacion', 'Coordinación', (SELECT id FROM roles WHERE code = 'gestor-cultural'), (SELECT id FROM disciplines WHERE code = 'gestion-cultural'), 5);

-- Roles: Patrimonio
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('conservador', 'Conservador', (SELECT id FROM disciplines WHERE code = 'patrimonio'), 5),
('restaurador', 'Restaurador', (SELECT id FROM disciplines WHERE code = 'patrimonio'), 5);

-- Especializaciones: Conservador
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('arte-conservacion', 'Arte', (SELECT id FROM roles WHERE code = 'conservador'), (SELECT id FROM disciplines WHERE code = 'patrimonio'), 5),
('documentos', 'Documentos', (SELECT id FROM roles WHERE code = 'conservador'), (SELECT id FROM disciplines WHERE code = 'patrimonio'), 5),
('objetos', 'Objetos', (SELECT id FROM roles WHERE code = 'conservador'), (SELECT id FROM disciplines WHERE code = 'patrimonio'), 5);

-- Especializaciones: Restaurador
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('pintura-restauracion', 'Pintura', (SELECT id FROM roles WHERE code = 'restaurador'), (SELECT id FROM disciplines WHERE code = 'patrimonio'), 5),
('escultura-restauracion', 'Escultura', (SELECT id FROM roles WHERE code = 'restaurador'), (SELECT id FROM disciplines WHERE code = 'patrimonio'), 5),
('mobiliario-restauracion', 'Mobiliario', (SELECT id FROM roles WHERE code = 'restaurador'), (SELECT id FROM disciplines WHERE code = 'patrimonio'), 5);

-- ============================================================
-- CATEGORÍA 6: ARTE DIGITAL Y TECNOLOGÍA
-- ============================================================

-- Disciplinas de Arte Digital
INSERT INTO disciplines (code, name, category_id) VALUES
('diseno-digital', 'Diseño Digital', 6),
('desarrollo-creativo', 'Desarrollo Creativo', 6),
('contenido-digital', 'Contenido Digital', 6),
('arte-generativo', 'Arte Generativo', 6),
('produccion-digital', 'Producción Digital', 6);

-- Roles: Diseño Digital
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('disenador-ux-ui', 'Diseñador UX/UI', (SELECT id FROM disciplines WHERE code = 'diseno-digital'), 6),
('disenador-web', 'Diseñador Web', (SELECT id FROM disciplines WHERE code = 'diseno-digital'), 6);

-- Especializaciones: Diseñador UX/UI
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('web-ux', 'Web', (SELECT id FROM roles WHERE code = 'disenador-ux-ui'), (SELECT id FROM disciplines WHERE code = 'diseno-digital'), 6),
('mobile', 'Mobile', (SELECT id FROM roles WHERE code = 'disenador-ux-ui'), (SELECT id FROM disciplines WHERE code = 'diseno-digital'), 6),
('producto-digital-ux', 'Producto digital', (SELECT id FROM roles WHERE code = 'disenador-ux-ui'), (SELECT id FROM disciplines WHERE code = 'diseno-digital'), 6);

-- Especializaciones: Diseñador Web
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('landing-pages', 'Landing pages', (SELECT id FROM roles WHERE code = 'disenador-web'), (SELECT id FROM disciplines WHERE code = 'diseno-digital'), 6),
('e-commerce', 'E-commerce', (SELECT id FROM roles WHERE code = 'disenador-web'), (SELECT id FROM disciplines WHERE code = 'diseno-digital'), 6),
('corporativo-web', 'Corporativo', (SELECT id FROM roles WHERE code = 'disenador-web'), (SELECT id FROM disciplines WHERE code = 'diseno-digital'), 6);

-- Roles: Desarrollo Creativo
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('desarrollador-creativo', 'Desarrollador Creativo', (SELECT id FROM disciplines WHERE code = 'desarrollo-creativo'), 6);

-- Especializaciones: Desarrollador Creativo
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('frontend', 'Frontend creativo', (SELECT id FROM roles WHERE code = 'desarrollador-creativo'), (SELECT id FROM disciplines WHERE code = 'desarrollo-creativo'), 6),
('experiencias-interactivas', 'Experiencias interactivas', (SELECT id FROM roles WHERE code = 'desarrollador-creativo'), (SELECT id FROM disciplines WHERE code = 'desarrollo-creativo'), 6),
('creative-coding', 'Creative coding', (SELECT id FROM roles WHERE code = 'desarrollador-creativo'), (SELECT id FROM disciplines WHERE code = 'desarrollo-creativo'), 6);

-- Roles: Contenido Digital
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('creador-contenido', 'Creador de Contenido', (SELECT id FROM disciplines WHERE code = 'contenido-digital'), 6),
('community-manager', 'Community Manager', (SELECT id FROM disciplines WHERE code = 'contenido-digital'), 6);

-- Especializaciones: Creador de Contenido
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('ugc', 'UGC', (SELECT id FROM roles WHERE code = 'creador-contenido'), (SELECT id FROM disciplines WHERE code = 'contenido-digital'), 6),
('influencer', 'Influencer', (SELECT id FROM roles WHERE code = 'creador-contenido'), (SELECT id FROM disciplines WHERE code = 'contenido-digital'), 6),
('content-creator', 'Content creator', (SELECT id FROM roles WHERE code = 'creador-contenido'), (SELECT id FROM disciplines WHERE code = 'contenido-digital'), 6);

-- Especializaciones: Community Manager
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('marca', 'Marca', (SELECT id FROM roles WHERE code = 'community-manager'), (SELECT id FROM disciplines WHERE code = 'contenido-digital'), 6),
('artista-cm', 'Artista', (SELECT id FROM roles WHERE code = 'community-manager'), (SELECT id FROM disciplines WHERE code = 'contenido-digital'), 6),
('emprendimiento', 'Emprendimiento', (SELECT id FROM roles WHERE code = 'community-manager'), (SELECT id FROM disciplines WHERE code = 'contenido-digital'), 6);

-- Roles: Arte Generativo
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('artista-digital', 'Artista Digital', (SELECT id FROM disciplines WHERE code = 'arte-generativo'), 6);

-- Especializaciones: Artista Digital
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('nft', 'NFT', (SELECT id FROM roles WHERE code = 'artista-digital'), (SELECT id FROM disciplines WHERE code = 'arte-generativo'), 6),
('vr', 'Realidad virtual', (SELECT id FROM roles WHERE code = 'artista-digital'), (SELECT id FROM disciplines WHERE code = 'arte-generativo'), 6),
('ar', 'Realidad aumentada', (SELECT id FROM roles WHERE code = 'artista-digital'), (SELECT id FROM disciplines WHERE code = 'arte-generativo'), 6),
('ia', 'IA generativa', (SELECT id FROM roles WHERE code = 'artista-digital'), (SELECT id FROM disciplines WHERE code = 'arte-generativo'), 6);

-- Roles: Producción Digital
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('editor-video', 'Editor de Video', (SELECT id FROM disciplines WHERE code = 'produccion-digital'), 6),
('motion-designer', 'Motion Designer', (SELECT id FROM disciplines WHERE code = 'produccion-digital'), 6),
('disenador-3d', 'Diseñador 3D', (SELECT id FROM disciplines WHERE code = 'produccion-digital'), 6);

-- Especializaciones: Editor de Video
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('comercial-video', 'Comercial', (SELECT id FROM roles WHERE code = 'editor-video'), (SELECT id FROM disciplines WHERE code = 'produccion-digital'), 6),
('narrativo', 'Narrativo', (SELECT id FROM roles WHERE code = 'editor-video'), (SELECT id FROM disciplines WHERE code = 'produccion-digital'), 6),
('musical-video', 'Musical', (SELECT id FROM roles WHERE code = 'editor-video'), (SELECT id FROM disciplines WHERE code = 'produccion-digital'), 6);

-- Especializaciones: Motion Designer
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('2d-motion', '2D', (SELECT id FROM roles WHERE code = 'motion-designer'), (SELECT id FROM disciplines WHERE code = 'produccion-digital'), 6),
('3d-motion', '3D', (SELECT id FROM roles WHERE code = 'motion-designer'), (SELECT id FROM disciplines WHERE code = 'produccion-digital'), 6),
('mixto', 'Mixto', (SELECT id FROM roles WHERE code = 'motion-designer'), (SELECT id FROM disciplines WHERE code = 'produccion-digital'), 6);

-- Especializaciones: Diseñador 3D
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('modelado', 'Modelado', (SELECT id FROM roles WHERE code = 'disenador-3d'), (SELECT id FROM disciplines WHERE code = 'produccion-digital'), 6),
('texturizado', 'Texturizado', (SELECT id FROM roles WHERE code = 'disenador-3d'), (SELECT id FROM disciplines WHERE code = 'produccion-digital'), 6),
('renderizado', 'Renderizado', (SELECT id FROM roles WHERE code = 'disenador-3d'), (SELECT id FROM disciplines WHERE code = 'produccion-digital'), 6);

-- ============================================================
-- CATEGORÍA 7: SERVICIOS CREATIVOS
-- ============================================================

-- Disciplinas de Servicios Creativos
INSERT INTO disciplines (code, name, category_id) VALUES
('representacion-gestion', 'Representación y Gestión', 7),
('promocion-marketing', 'Promoción y Marketing', 7),
('educacion-mentoria', 'Educación y Mentoría', 7),
('servicios-evento', 'Servicios de Evento', 7),
('consultoria-creativa', 'Consultoría Creativa', 7);

-- Roles: Representación y Gestión
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('agente-talento', 'Agente de Talento', (SELECT id FROM disciplines WHERE code = 'representacion-gestion'), 7),
('manager-artistico', 'Mánager Artístico', (SELECT id FROM disciplines WHERE code = 'representacion-gestion'), 7);

-- Especializaciones: Agente de Talento
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('artistico', 'Artístico', (SELECT id FROM roles WHERE code = 'agente-talento'), (SELECT id FROM disciplines WHERE code = 'representacion-gestion'), 7),
('deportivo', 'Deportivo', (SELECT id FROM roles WHERE code = 'agente-talento'), (SELECT id FROM disciplines WHERE code = 'representacion-gestion'), 7),
('corporativo-agente', 'Corporativo', (SELECT id FROM roles WHERE code = 'agente-talento'), (SELECT id FROM disciplines WHERE code = 'representacion-gestion'), 7);

-- Especializaciones: Mánager Artístico
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('musica-manager', 'Música', (SELECT id FROM roles WHERE code = 'manager-artistico'), (SELECT id FROM disciplines WHERE code = 'representacion-gestion'), 7),
('artes-escenicas-manager', 'Artes escénicas', (SELECT id FROM roles WHERE code = 'manager-artistico'), (SELECT id FROM disciplines WHERE code = 'representacion-gestion'), 7),
('audiovisual', 'Audiovisual', (SELECT id FROM roles WHERE code = 'manager-artistico'), (SELECT id FROM disciplines WHERE code = 'representacion-gestion'), 7);

-- Roles: Promoción y Marketing
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('promotor-cultural', 'Promotor Cultural', (SELECT id FROM disciplines WHERE code = 'promocion-marketing'), 7);

-- Especializaciones: Promotor Cultural
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('eventos-promotor', 'Eventos', (SELECT id FROM roles WHERE code = 'promotor-cultural'), (SELECT id FROM disciplines WHERE code = 'promocion-marketing'), 7),
('festivales', 'Festivales', (SELECT id FROM roles WHERE code = 'promotor-cultural'), (SELECT id FROM disciplines WHERE code = 'promocion-marketing'), 7),
('institucional-promotor', 'Institucional', (SELECT id FROM roles WHERE code = 'promotor-cultural'), (SELECT id FROM disciplines WHERE code = 'promocion-marketing'), 7);

-- Roles: Educación y Mentoría
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('mentor-artistico', 'Mentor Artístico', (SELECT id FROM disciplines WHERE code = 'educacion-mentoria'), 7),
('conferencista', 'Conferencista', (SELECT id FROM disciplines WHERE code = 'educacion-mentoria'), 7);

-- Especializaciones: Mentor Artístico
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('coaching', 'Coaching', (SELECT id FROM roles WHERE code = 'mentor-artistico'), (SELECT id FROM disciplines WHERE code = 'educacion-mentoria'), 7),
('talleres', 'Talleres', (SELECT id FROM roles WHERE code = 'mentor-artistico'), (SELECT id FROM disciplines WHERE code = 'educacion-mentoria'), 7),
('masterclasses', 'Masterclasses', (SELECT id FROM roles WHERE code = 'mentor-artistico'), (SELECT id FROM disciplines WHERE code = 'educacion-mentoria'), 7);

-- Especializaciones: Conferencista
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('arte-conferencia', 'Arte', (SELECT id FROM roles WHERE code = 'conferencista'), (SELECT id FROM disciplines WHERE code = 'educacion-mentoria'), 7),
('cultura', 'Cultura', (SELECT id FROM roles WHERE code = 'conferencista'), (SELECT id FROM disciplines WHERE code = 'educacion-mentoria'), 7),
('creatividad', 'Creatividad', (SELECT id FROM roles WHERE code = 'conferencista'), (SELECT id FROM disciplines WHERE code = 'educacion-mentoria'), 7);

-- Roles: Servicios de Evento
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('productor-eventos', 'Productor de Eventos', (SELECT id FROM disciplines WHERE code = 'servicios-evento'), 7);

-- Especializaciones: Productor de Eventos
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('corporativo-eventos', 'Corporativo', (SELECT id FROM roles WHERE code = 'productor-eventos'), (SELECT id FROM disciplines WHERE code = 'servicios-evento'), 7),
('social', 'Social', (SELECT id FROM roles WHERE code = 'productor-eventos'), (SELECT id FROM disciplines WHERE code = 'servicios-evento'), 7),
('cultural-eventos', 'Cultural', (SELECT id FROM roles WHERE code = 'productor-eventos'), (SELECT id FROM disciplines WHERE code = 'servicios-evento'), 7);

-- Roles: Consultoría Creativa
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('consultor-cultural', 'Consultor Cultural', (SELECT id FROM disciplines WHERE code = 'consultoria-creativa'), 7),
('director-creativo', 'Director Creativo', (SELECT id FROM disciplines WHERE code = 'consultoria-creativa'), 7);

-- Especializaciones: Consultor Cultural
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('estrategia', 'Estrategia', (SELECT id FROM roles WHERE code = 'consultor-cultural'), (SELECT id FROM disciplines WHERE code = 'consultoria-creativa'), 7),
('innovacion', 'Innovación', (SELECT id FROM roles WHERE code = 'consultor-cultural'), (SELECT id FROM disciplines WHERE code = 'consultoria-creativa'), 7),
('branding-cultural', 'Branding cultural', (SELECT id FROM roles WHERE code = 'consultor-cultural'), (SELECT id FROM disciplines WHERE code = 'consultoria-creativa'), 7);

-- Especializaciones: Director Creativo
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('publicidad-creativo', 'Publicidad', (SELECT id FROM roles WHERE code = 'director-creativo'), (SELECT id FROM disciplines WHERE code = 'consultoria-creativa'), 7),
('branding-director', 'Branding', (SELECT id FROM roles WHERE code = 'director-creativo'), (SELECT id FROM disciplines WHERE code = 'consultoria-creativa'), 7),
('contenido-director', 'Contenido', (SELECT id FROM roles WHERE code = 'director-creativo'), (SELECT id FROM disciplines WHERE code = 'consultoria-creativa'), 7);

-- Verificar resultados finales
SELECT 'Total Categorías:' as tabla, COUNT(*) as total FROM categories
UNION ALL
SELECT 'Total Disciplinas:', COUNT(*) FROM disciplines
UNION ALL
SELECT 'Total Roles:', COUNT(*) FROM roles
UNION ALL
SELECT 'Total Especializaciones:', COUNT(*) FROM specializations;
