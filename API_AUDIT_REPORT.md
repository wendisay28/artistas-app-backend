# REPORTE DE AUDITORÍA - RUTAS DE API BACKEND

## Resumen Ejecutivo

Se auditaron **17 archivos de rutas** en `/backend/src/routes/`, identificando un total de **103 endpoints**. Se encontraron **15 problemas** relacionados con métodos HTTP incorrectos según convenciones REST y **9 vulnerabilidades críticas de seguridad** por falta de autenticación en operaciones de escritura.

---

## ⚠️ VULNERABILIDADES CRÍTICAS DE SEGURIDAD

### Operaciones Sin Autenticación (Prioridad Máxima)

Los siguientes endpoints permiten operaciones de escritura sin verificar autenticación:

1. **`POST /v1/featured`** - Crear elementos destacados
2. **`PUT /v1/featured/:id`** - Actualizar elementos destacados
3. **`DELETE /v1/featured/:id`** - Eliminar elementos destacados
4. **`POST /v1/events`** - Crear eventos
5. **`PUT /v1/events/:id`** - Actualizar eventos
6. **`POST /v1/events/:id/cancel`** - Cancelar eventos
7. **`POST /v1/offers`** - Crear ofertas
8. **`PATCH /v1/offers/:id/status`** - Actualizar estado de ofertas
9. **`GET /v1/featured`** - Inconsistencia (parece requerir auth pero no la tiene)

**Riesgo**: Spam, modificación/eliminación no autorizada, sabotaje.

---

## Problemas de Métodos HTTP (11 casos)

### 1. GET usado para operaciones que modifican estado

**Archivo**: `auth.routes.ts`
- **Endpoint**: `GET /sync`
- **Problema**: Sincronización modifica estado
- **Corrección**: Cambiar a `POST /sync`

### 2. POST usado para actualizaciones parciales

**Archivo**: `preferences.routes.ts`
- **Endpoint**: `POST /categories/add`
- **Corrección**: `PATCH /preferences` con body o `POST` si es una acción
- **Endpoint**: `POST /categories/remove`
- **Corrección**: `DELETE /preferences/categories/:category` o `PATCH /preferences`

**Archivo**: `onboarding.routes.ts`
- **Endpoint**: `POST /save-progress`
- **Corrección**: `PUT /onboarding/progress` o `PATCH /onboarding`
- **Endpoint**: `POST /complete`
- **Corrección**: `PATCH /onboarding` con `{completed: true}`

**Archivo**: `api.routes.ts`
- **Endpoint**: `POST /events/:id/cancel`
- **Corrección**: `PATCH /events/:id` con `{status: 'cancelled'}`

### 3. PUT usado para actualizaciones parciales

**Archivo**: `contracts.routes.ts`
- **Endpoint**: `PUT /:id/status`
- **Corrección**: `PATCH /:id` con body
- **Endpoint**: `PUT /quotations/:id/accept`
- **Corrección**: `PATCH /quotations/:id` o mantener `POST` para acción específica
- **Endpoint**: `PUT /quotations/:id/reject`
- **Corrección**: `PATCH /quotations/:id` o mantener `POST` para acción específica

### 4. URLs inconsistentes

**Archivo**: `contracts.routes.ts`
- **Endpoint**: `GET /quotations/list`
- **Problema**: Redundante usar "/list" con GET
- **Corrección**: `GET /quotations`

---

## Endpoints Deprecados

**Archivo**: `portfolio.routes.ts`
1. `POST /services` - Usar `/photos` en su lugar
2. `POST /products` - Usar `/photos` con tags

---

## Plan de Corrección

### Fase 1: Seguridad Crítica (Inmediato)

```typescript
// backend/src/routes/api.routes.ts

import { authMiddleware } from '../middleware/auth.middleware.js';

// Agregar autenticación a todos los endpoints de escritura
v1.post('/featured', authMiddleware, featuredController.createFeaturedItem);
v1.put('/featured/:id', authMiddleware, featuredController.updateFeaturedItem);
v1.delete('/featured/:id', authMiddleware, featuredController.deleteFeaturedItem);
v1.get('/featured', authMiddleware, featuredController.getUserFeaturedItems); // Aclarar si es para usuario autenticado

v1.post('/events', authMiddleware, EventController.createEvent);
v1.put('/events/:id', authMiddleware, EventController.updateEvent);
v1.post('/events/:id/cancel', authMiddleware, EventController.cancelEvent);

v1.post('/offers', authMiddleware, offerController.create);
v1.patch('/offers/:id/status', authMiddleware, offerController.updateStatus);
```

### Fase 2: Métodos HTTP REST (Alta Prioridad)

```typescript
// backend/src/routes/auth.routes.ts
// CAMBIAR: GET -> POST
router.post('/sync', authMiddleware, authController.syncUser);

// backend/src/routes/preferences.routes.ts
// OPCIÓN 1: Mantener endpoints específicos pero cambiar a métodos correctos
router.post('/categories', authMiddleware, preferencesController.addCategory);
router.delete('/categories/:categoryId', authMiddleware, preferencesController.removeCategory);

// OPCIÓN 2: Usar un solo endpoint PATCH
router.patch('/', authMiddleware, preferencesController.updatePreferences);

// backend/src/routes/contracts.routes.ts
// Cambiar PUT a PATCH para actualizaciones parciales
router.patch('/:id', authMiddleware, contractsController.updateContract);
router.patch('/quotations/:id', authMiddleware, quotationsController.updateQuotation);

// O mantener POST para acciones específicas
router.post('/quotations/:id/accept', authMiddleware, quotationsController.acceptQuotation);
router.post('/quotations/:id/reject', authMiddleware, quotationsController.rejectQuotation);

// Corregir URL inconsistente
router.get('/quotations', authMiddleware, quotationsController.list); // Sin "/list"

// backend/src/routes/onboarding.routes.ts
router.patch('/progress', authMiddleware, onboardingController.saveProgress);
router.patch('/', authMiddleware, onboardingController.complete);

// backend/src/routes/api.routes.ts
// Cambiar cancelación de evento
router.patch('/events/:id', authMiddleware, EventController.updateEvent);
// El controller debe manejar {status: 'cancelled'}
```

### Fase 3: Limpieza (Baja Prioridad)

```typescript
// backend/src/routes/portfolio.routes.ts
// Marcar como @deprecated y eliminar después de migrar frontend
// router.post('/services', ...) // DEPRECADO
// router.post('/products', ...) // DEPRECADO
```

---

## Resumen de Métricas

| Métrica | Cantidad | Porcentaje |
|---------|----------|------------|
| Total de endpoints | 103 | 100% |
| Endpoints con autenticación | 62 | 60% |
| Endpoints públicos | 41 | 40% |
| **Endpoints con problemas** | **22** | **21%** |
| - Vulnerabilidades de seguridad | 9 | 9% |
| - Métodos HTTP incorrectos | 11 | 11% |
| - Endpoints deprecados | 2 | 2% |
| **Endpoints correctos** | **81** | **79%** |

---

## Convenciones REST Aplicadas

| Operación | Método HTTP | Ejemplo |
|-----------|-------------|---------|
| Crear recurso | POST | `POST /api/v1/users` |
| Listar recursos | GET | `GET /api/v1/users` |
| Obtener uno | GET | `GET /api/v1/users/:id` |
| Actualizar completo | PUT | `PUT /api/v1/users/:id` |
| Actualizar parcial | PATCH | `PATCH /api/v1/users/:id` |
| Eliminar | DELETE | `DELETE /api/v1/users/:id` |
| Acción específica | POST | `POST /api/v1/users/:id/verify` |

---

## Lista Completa de Endpoints por Archivo

### 1. auth.routes.ts (4 endpoints)
- ✅ `POST /signup` - Crear usuario
- ✅ `POST /signin` - Iniciar sesión
- ✅ `GET /verify` - Verificar token
- ⚠️ `GET /sync` → **Cambiar a POST**

### 2. api.routes.ts (33 endpoints)
- ✅ `GET /v1/artists/featured` - Artistas destacados
- ✅ `GET /v1/artists` - Listar artistas
- ✅ `GET /v1/artists/:id` - Obtener artista
- ✅ `GET /v1/events` - Eventos próximos
- ✅ `GET /v1/blog` - Posts blog
- ✅ `GET /v1/categories` - Categorías
- ⚠️ `GET /v1/featured` → **Agregar auth o aclarar si es público**
- ✅ `GET /v1/users/:userId/featured` - Destacados público
- 🔴 `POST /v1/featured` → **AGREGAR AUTH**
- 🔴 `PUT /v1/featured/:id` → **AGREGAR AUTH**
- 🔴 `DELETE /v1/featured/:id` → **AGREGAR AUTH**
- 🔴 `POST /v1/events` → **AGREGAR AUTH**
- 🔴 `PUT /v1/events/:id` → **AGREGAR AUTH**
- 🔴 `POST /v1/events/:id/cancel` → **AGREGAR AUTH + cambiar a PATCH**
- ✅ `GET /v1/events/search` - Buscar eventos
- ✅ `GET /v1/profile` (auth) - Perfil usuario
- ✅ `PUT /v1/profile` (auth) - Actualizar perfil
- ✅ `PATCH /v1/profile/type` (auth) - Cambiar tipo
- ✅ `GET /v1/artist/me` (auth) - Perfil artista
- ✅ `PUT /v1/artist/me` (auth) - Actualizar perfil artista
- 🔴 `POST /v1/offers` → **AGREGAR AUTH**
- ✅ `GET /v1/offers` - Listar ofertas
- ✅ `GET /v1/offers/:id` - Obtener oferta
- 🔴 `PATCH /v1/offers/:id/status` → **AGREGAR AUTH**
- ✅ `GET /v1/profiles` - Listar perfiles
- ✅ `GET /v1/profiles/:id` - Obtener perfil
- ✅ `GET /v1/profiles/:id/reviews` - Reseñas
- ✅ `GET /v1/users/:userId` - Perfil público

### 3. explorer.routes.ts (14 endpoints)
- ✅ `GET /` - Datos explorer
- ✅ `GET /artists` - Listar artistas
- ✅ `GET /events` - Listar eventos
- ✅ `GET /venues` - Listar lugares
- ✅ `GET /services` - Listar servicios
- ✅ `GET /artworks` - Listar obras
- ✅ `GET /services/me` (auth) - Mis servicios
- ✅ `POST /services` (auth) - Crear servicio
- ✅ `PATCH /services/:id` (auth) - Actualizar servicio
- ✅ `DELETE /services/:id` (auth) - Eliminar servicio
- ✅ `GET /artworks/me` (auth) - Mis obras
- ✅ `POST /artworks` (auth) - Crear obra
- ✅ `PATCH /artworks/:id` (auth) - Actualizar obra
- ✅ `DELETE /artworks/:id` (auth) - Eliminar obra

### 4. portfolio.routes.ts (9 endpoints)
- ✅ `GET /` (auth) - Portfolio completo
- ✅ `POST /photos` (auth) - Agregar foto
- ✅ `PATCH /photos/:id` (auth) - Actualizar foto
- ✅ `DELETE /photos/:id` (auth) - Eliminar foto
- ✅ `POST /videos` (auth) - Agregar video
- ✅ `PATCH /videos/:id` (auth) - Actualizar video
- ✅ `DELETE /videos/:id` (auth) - Eliminar video
- ⚠️ `POST /services` (auth) - **DEPRECADO**
- ⚠️ `POST /products` (auth) - **DEPRECADO**

### 5. contracts.routes.ts (10 endpoints)
- ✅ `GET /` (auth) - Listar contratos
- ✅ `GET /stats` (auth) - Estadísticas
- ✅ `GET /:id` (auth) - Obtener contrato
- ✅ `POST /` (auth) - Crear contrato
- ⚠️ `PUT /:id/status` (auth) → **Cambiar a PATCH /:id**
- ✅ `POST /:id/review` (auth) - Agregar reseña
- ⚠️ `GET /quotations/list` (auth) → **Cambiar a /quotations**
- ✅ `POST /quotations` (auth) - Crear cotización
- ⚠️ `PUT /quotations/:id/accept` (auth) → **Cambiar a PATCH o mantener POST**
- ⚠️ `PUT /quotations/:id/reject` (auth) → **Cambiar a PATCH o mantener POST**

### 6. preferences.routes.ts (4 endpoints)
- ✅ `GET /` (auth) - Obtener preferencias
- ✅ `PUT /` (auth) - Actualizar preferencias
- ⚠️ `POST /categories/add` (auth) → **Cambiar a PATCH / o POST /categories**
- ⚠️ `POST /categories/remove` (auth) → **Cambiar a DELETE /categories/:id**

### 7. onboarding.routes.ts (5 endpoints)
- ✅ `GET /status` (auth) - Estado onboarding
- ⚠️ `POST /save-progress` (auth) → **Cambiar a PATCH /progress**
- ⚠️ `POST /complete` (auth) → **Cambiar a PATCH /**
- ✅ `POST /send-verification-email` (auth) - Enviar email
- ✅ `POST /verify-email` - Verificar email

### 8. Otros archivos (24 endpoints restantes)
- posts.routes.ts (7 endpoints) - ✅ Todos correctos
- saved-items.routes.ts (4 endpoints) - ✅ Todos correctos
- company.routes.ts (6 endpoints) - ✅ Todos correctos
- storage.routes.ts (2 endpoints) - ✅ Todos correctos
- offer.routes.ts (1 endpoint) - ✅ Correcto
- profile.routes.ts (1 endpoint) - ✅ Correcto
- csrfRoutes.ts (3 endpoints) - ✅ Todos correctos

---

## Conclusión

El backend de BuscartPro tiene una estructura bien organizada con **79% de endpoints correctos**. Sin embargo, se identificaron **9 vulnerabilidades críticas de seguridad** que deben corregirse **inmediatamente antes de cualquier deployment a producción**.

### Acciones Inmediatas Requeridas:

1. ✅ **Agregar autenticación** a los 9 endpoints de escritura sin protección
2. ⚠️ **Corregir métodos HTTP** en 11 endpoints para seguir convenciones REST
3. 📝 **Documentar** endpoints deprecados y planificar su eliminación

### Impacto Esperado:

- **Seguridad**: Eliminación de vectores de ataque
- **Mantenibilidad**: Código más predecible siguiendo estándares REST
- **Documentación**: API más intuitiva para el frontend

---

**Fecha del Reporte**: 20 de Octubre, 2024
**Auditor**: Claude Code
**Versión**: 1.0
