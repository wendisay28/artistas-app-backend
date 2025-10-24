# 🚀 Migración del Explorador - BuscartPro

## 📋 Descripción

Esta migración agrega todas las tablas y campos necesarios para integrar los perfiles de usuario con el explorador, permitiendo que la información se muestre dinámicamente desde la base de datos en lugar de usar datos mock.

## 🎯 ¿Qué hace esta migración?

### 1. **Tabla `users`** - Campos agregados:
- `profession` - Profesión del usuario (ej: "Ilustradora Digital")
- `tags` - Etiquetas/habilidades (ej: ["Arte", "Muralismo"])
- `availability` - Disponibilidad (ej: "Disponible esta semana")
- `portfolio_images` - Array de URLs de imágenes del portafolio
- `price_min` / `price_max` - Rango de precios
- `response_time` - Tiempo de respuesta promedio
- `languages` - Idiomas que habla
- `show_in_explorer` - Si aparece en el explorador
- `projects_completed` - Proyectos completados
- `followers_count` / `following_count` - Seguidores

### 2. **Tabla `services`** - NUEVA:
Servicios que ofrece cada usuario/artista:
- `name` - Nombre del servicio
- `description` - Descripción detallada
- `price` - Precio del servicio
- `duration` - Duración estimada
- `category` - Categoría del servicio
- `images` - Imágenes del servicio

### 3. **Tabla `artworks`** - NUEVA:
Obras de arte disponibles para compra/exhibición:
- `name` - Nombre de la obra
- `description` - Descripción
- `category` - Tipo: pintura, escultura, libro, fotografía
- `images` - Imágenes de la obra
- `price` - Precio
- `dimensions` - Dimensiones
- `materials` - Materiales usados
- `year` - Año de creación
- `available` / `stock` - Disponibilidad

### 4. **Tabla `events`** - Campos agregados:
- `owner_user_id` - Usuario propietario del evento
- `images` - Array de imágenes
- `time` - Hora del evento
- `distance` - Distancia (calculada dinámicamente)
- `show_in_explorer` - Si aparece en el explorador

### 5. **Tablas `venues`, `artists`, `companies`** - Campos agregados:
- `images` - Array de imágenes
- `distance` - Distancia
- `show_in_explorer` - Visibilidad en explorador
- Otros campos específicos para cada tabla

## 🔧 Cómo ejecutar la migración

### Opción 1: Usando npm script (Recomendado)

```bash
cd backend
npm run migrate:explorer
```

### Opción 2: Manualmente en Supabase Dashboard

Si el script no funciona, puedes ejecutar el SQL manualmente:

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Abre el archivo `backend/src/migrations/add-explorer-fields.sql`
5. Copia todo el contenido
6. Pégalo en el SQL Editor
7. Haz clic en **Run**

## ✅ Verificar que funcionó

Después de ejecutar la migración, verifica que las tablas se crearon:

```sql
-- En Supabase SQL Editor, ejecuta:

-- Ver la nueva tabla services
SELECT * FROM services LIMIT 1;

-- Ver la nueva tabla artworks
SELECT * FROM artworks LIMIT 1;

-- Ver los nuevos campos en users
SELECT profession, tags, show_in_explorer FROM users LIMIT 1;

-- Ver los índices creados
SELECT indexname FROM pg_indexes
WHERE tablename IN ('services', 'artworks', 'events', 'venues');
```

## 📊 Estructura de Datos

### Ejemplo de Usuario con datos del explorador:

```json
{
  "id": "user-123",
  "email": "artista@example.com",
  "firstName": "Carla",
  "lastName": "Ortiz",
  "profession": "Ilustradora Digital",
  "city": "Medellín",
  "tags": ["Ilustración", "Muralismo", "Arte Urbano"],
  "availability": "Disponible esta semana",
  "portfolio_images": [
    "https://example.com/img1.jpg",
    "https://example.com/img2.jpg"
  ],
  "price_min": 100000,
  "price_max": 300000,
  "response_time": "1 hora",
  "languages": ["Español", "Inglés"],
  "show_in_explorer": true,
  "projects_completed": 87,
  "rating": 4.8
}
```

### Ejemplo de Servicio:

```json
{
  "id": 1,
  "user_id": "user-123",
  "name": "Ilustración Digital Personalizada",
  "description": "Creo ilustraciones digitales únicas para tus proyectos",
  "price": 120000,
  "duration": "2-3 días",
  "category": "Ilustración",
  "images": ["https://example.com/service1.jpg"]
}
```

### Ejemplo de Artwork:

```json
{
  "id": 1,
  "user_id": "user-123",
  "name": "Atardecer en los Andes",
  "description": "Pintura al óleo...",
  "category": "pintura",
  "images": ["https://example.com/painting.jpg"],
  "price": 2500000,
  "dimensions": "80 x 60 cm",
  "year": 2023,
  "available": true,
  "city": "Bogotá",
  "tags": ["Óleo", "Paisaje"]
}
```

## 🔍 Índices Creados

La migración crea índices automáticamente para optimizar búsquedas:

- `idx_services_user_id` - Búsqueda de servicios por usuario
- `idx_artworks_category` - Búsqueda de obras por categoría
- `idx_events_city` - Búsqueda de eventos por ciudad
- `idx_venues_show_in_explorer` - Venues visibles en explorador
- Y muchos más...

## 🎨 Próximos Pasos

Después de ejecutar esta migración, los siguientes pasos son:

1. ✅ **Migración completada** ← Estás aquí
2. ⏳ Crear endpoints API del explorador
3. ⏳ Crear componente "Explorador" en el perfil
4. ⏳ Integrar API real en el explorador (reemplazar mocks)
5. ⏳ Crear modal de detalles completos

## ⚠️ Notas Importantes

- **NO elimina datos existentes**: La migración solo agrega columnas y tablas nuevas
- **Seguro para producción**: Usa `ALTER TABLE IF NOT EXISTS` para evitar errores
- **Reversible**: Si necesitas revertir, guarda un backup antes
- **Performance**: Los índices mejoran el rendimiento de búsquedas

## 🆘 Solución de Problemas

### Error: "relation already exists"
✅ **Solución**: Esto es normal, significa que la tabla ya existe. La migración lo maneja automáticamente.

### Error: "column already exists"
✅ **Solución**: Igual que arriba, el campo ya existe. Se omite automáticamente.

### Error: "permission denied"
❌ **Solución**: Asegúrate de usar `SUPABASE_SERVICE_ROLE_KEY` en tu `.env`, no la `ANON_KEY`.

## 📞 Soporte

Si tienes problemas, revisa:
1. Que las variables de entorno estén correctas (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
2. Que tengas permisos de administrador en Supabase
3. Los logs de la migración para ver qué statement falló

---

**Fecha de creación**: 2025-01-16
**Versión**: 1.0
**Autor**: BuscartPro Development Team
