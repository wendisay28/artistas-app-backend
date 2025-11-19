# API de Portfolio - Documentación

Esta documentación describe los endpoints disponibles para gestionar el contenido del perfil del usuario: Blog, Servicios, Tienda/Productos, y Galería.

## Tabla de Contenidos
1. [Blog Posts](#blog-posts)
2. [Servicios](#servicios)
3. [Tienda/Productos](#tienda-productos)
4. [Galería (Fotos y Videos)](#galería)
5. [Upload de Archivos](#upload-de-archivos)

---

## Blog Posts

Endpoints para gestionar publicaciones del blog en el perfil del usuario.

### Base URL
`/api/v1/blog`

### Endpoints

#### 1. Obtener todas las publicaciones (públicas)
```http
GET /api/v1/blog
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Número de items por página (default: 10)
- `category` (opcional): Filtrar por categoría
- `search` (opcional): Buscar en título y contenido

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### 2. Obtener mis publicaciones
```http
GET /api/v1/blog/me
Authorization: Bearer <token>
```

#### 3. Obtener una publicación por ID
```http
GET /api/v1/blog/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Mi publicación",
    "slug": "mi-publicacion",
    "content": "Contenido...",
    "featuredImage": "https://...",
    "gallery": [],
    "author": {
      "id": "uuid",
      "firstName": "Juan",
      "lastName": "Pérez"
    }
  }
}
```

#### 4. Crear una publicación
```http
POST /api/v1/blog
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Título de la publicación",
  "subtitle": "Subtítulo opcional",
  "content": "Contenido de la publicación en texto o markdown",
  "category": "tutorial",
  "tags": ["arte", "tutorial"],
  "featuredImage": "https://url-de-imagen.jpg",
  "gallery": ["https://imagen1.jpg", "https://imagen2.jpg"],
  "videoUrl": "https://youtube.com/...",
  "visibility": "public", // public, private, draft, archived
  "allowComments": true,
  "isFeatured": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Publicación creada exitosamente",
  "data": {
    "id": 1,
    "title": "Título de la publicación",
    "slug": "titulo-de-la-publicacion",
    "readingTime": 5,
    ...
  }
}
```

#### 5. Actualizar una publicación
```http
PATCH /api/v1/blog/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:** (todos los campos opcionales)
```json
{
  "title": "Nuevo título",
  "content": "Nuevo contenido",
  "visibility": "public"
}
```

#### 6. Eliminar una publicación
```http
DELETE /api/v1/blog/:id
Authorization: Bearer <token>
```

---

## Servicios

Endpoints para gestionar servicios ofrecidos por el usuario.

### Base URL
`/api/v1/services`

### Endpoints

#### 1. Obtener mis servicios
```http
GET /api/v1/services/me
Authorization: Bearer <token>
```

#### 2. Obtener servicios de un usuario
```http
GET /api/v1/services/user/:userId
```

#### 3. Obtener un servicio por ID
```http
GET /api/v1/services/:id
```

#### 4. Crear un servicio
```http
POST /api/v1/services
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Sesión de fotos profesional",
  "description": "Sesión de fotos de 2 horas con retoque incluido",
  "price": 150000,
  "duration": "2 horas",
  "category": "Fotografía",
  "images": [
    "https://url-imagen1.jpg",
    "https://url-imagen2.jpg"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Servicio creado exitosamente",
  "data": {
    "id": 1,
    "userId": "uuid",
    "name": "Sesión de fotos profesional",
    "price": "150000.00",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

#### 5. Actualizar un servicio
```http
PATCH /api/v1/services/:id
Authorization: Bearer <token>
```

#### 6. Eliminar un servicio
```http
DELETE /api/v1/services/:id
Authorization: Bearer <token>
```

---

## Tienda / Productos

Endpoints para gestionar productos/artworks en la tienda del usuario.

### Base URL
`/api/v1/store`

### Endpoints

#### 1. Obtener mis productos
```http
GET /api/v1/store/me
Authorization: Bearer <token>
```

#### 2. Obtener productos de un usuario
```http
GET /api/v1/store/user/:userId
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Pintura al óleo",
      "description": "Paisaje abstracto",
      "category": "pintura",
      "price": "500000.00",
      "available": true,
      "stock": 1,
      "images": ["https://..."]
    }
  ]
}
```

#### 3. Obtener un producto por ID
```http
GET /api/v1/store/:id
```

#### 4. Crear un producto
```http
POST /api/v1/store
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Pintura al óleo - Atardecer",
  "description": "Paisaje abstracto representando un atardecer en la montaña",
  "category": "pintura", // pintura, escultura, libro, fotografía, digital, otro
  "images": [
    "https://url-imagen-principal.jpg",
    "https://url-imagen-detalle.jpg"
  ],
  "price": 500000,
  "dimensions": "50cm x 70cm",
  "materials": ["Óleo", "Lienzo"],
  "year": 2024,
  "available": true,
  "stock": 1,
  "tags": ["paisaje", "abstracto", "óleo"],
  "showInExplorer": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Producto creado exitosamente",
  "data": {
    "id": 1,
    "userId": "uuid",
    "name": "Pintura al óleo - Atardecer",
    "price": "500000.00",
    "available": true,
    "views": 0,
    "likes": 0,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

#### 5. Actualizar un producto
```http
PATCH /api/v1/store/:id
Authorization: Bearer <token>
```

#### 6. Eliminar un producto
```http
DELETE /api/v1/store/:id
Authorization: Bearer <token>
```

#### 7. Dar like a un producto
```http
POST /api/v1/store/:id/like
```

---

## Galería

Endpoints para gestionar fotos y videos del portfolio.

### Base URL
`/api/v1/portfolio`

### Endpoints - Fotos

#### 1. Obtener mi portfolio completo
```http
GET /api/v1/portfolio
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "photos": [
      {
        "id": 1,
        "imageUrl": "https://...",
        "title": "Mi foto",
        "description": "Descripción",
        "tags": ["retrato", "estudio"],
        "isPublic": true,
        "isFeatured": false,
        "orderPosition": 0,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "videos": [
      {
        "id": 1,
        "url": "https://youtube.com/...",
        "title": "Mi video",
        "type": "youtube",
        "thumbnailUrl": "https://...",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### 2. Agregar foto a la galería
```http
POST /api/v1/portfolio/photos
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "imageUrl": "https://storage.supabase.co/image.jpg",
  "title": "Mi obra de arte",
  "description": "Descripción de la imagen",
  "tags": ["arte", "portfolio"],
  "isPublic": true
}
```

#### 3. Actualizar foto
```http
PATCH /api/v1/portfolio/photos/:id
Authorization: Bearer <token>
```

#### 4. Eliminar foto
```http
DELETE /api/v1/portfolio/photos/:id
Authorization: Bearer <token>
```

#### 5. Marcar foto como destacada
```http
PATCH /api/v1/portfolio/photos/:id/featured
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "isFeatured": true,
  "orderPosition": 0
}
```

**Nota:** Solo se permiten 4 fotos destacadas.

### Endpoints - Videos

#### 1. Agregar video/enlace
```http
POST /api/v1/portfolio/videos
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "url": "https://youtube.com/watch?v=abc123",
  "title": "Mi video destacado",
  "description": "Descripción del video",
  "type": "youtube", // youtube, spotify, vimeo, soundcloud, other
  "thumbnailUrl": "https://example.com/thumb.jpg"
}
```

#### 2. Actualizar video/enlace
```http
PATCH /api/v1/portfolio/videos/:id
Authorization: Bearer <token>
```

#### 3. Eliminar video/enlace
```http
DELETE /api/v1/portfolio/videos/:id
Authorization: Bearer <token>
```

### Endpoints - Públicos

#### 1. Ver portfolio de otro usuario
```http
GET /api/v1/portfolio/user/:userId
```

#### 2. Ver trabajos destacados de otro usuario
```http
GET /api/v1/portfolio/user/:userId/featured
```

---

## Upload de Archivos

Para subir archivos (imágenes, videos, documentos), usa el servicio de storage.

### Servicio de Storage

El backend incluye un servicio completo de upload de archivos con Supabase Storage.

**Buckets disponibles:**
- `blog` - Imágenes para publicaciones del blog
- `gallery` - Fotos de la galería/portfolio
- `store` - Imágenes de productos
- `services` - Imágenes de servicios
- `avatars` - Fotos de perfil
- `portfolios` - General portfolio

### Uso en el código

```typescript
import { uploadMediaFiles, deleteMediaFile } from '../services/storage.service.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

// En tu ruta
app.post('/upload', upload.array('files'), async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const userId = req.user!.id;

  const mediaFiles = await uploadMediaFiles(files, 'gallery', userId);

  // mediaFiles contiene:
  // [
  //   {
  //     url: "https://...",
  //     path: "userId/uuid.jpg",
  //     type: "image",
  //     thumbnailUrl: "https://...",
  //     order: 0
  //   }
  // ]

  res.json({ success: true, data: mediaFiles });
});
```

### Endpoints de Storage

Ya existe un endpoint de storage en `/api/v1/storage/upload` que puedes usar.

---

## Códigos de Error

- `400` - Bad Request (datos inválidos)
- `401` - Unauthorized (no autenticado)
- `404` - Not Found (recurso no encontrado)
- `500` - Internal Server Error

## Autenticación

Todos los endpoints protegidos requieren un token JWT en el header:

```http
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- Endpoints de lectura: 100 requests/min
- Endpoints de modificación: 30 requests/min
- Endpoints de upload: 10 requests/min

---

## Ejemplos de Uso

### Crear una publicación de blog con imágenes

```javascript
// 1. Subir imágenes
const formData = new FormData();
formData.append('files', imageFile1);
formData.append('files', imageFile2);

const uploadResponse = await fetch('/api/v1/storage/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { data: images } = await uploadResponse.json();

// 2. Crear publicación con las URLs de las imágenes
const blogResponse = await fetch('/api/v1/blog', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Mi nueva publicación',
    content: 'Contenido de la publicación...',
    featuredImage: images[0].url,
    gallery: images.slice(1).map(img => img.url),
    visibility: 'public'
  })
});

const { data: post } = await blogResponse.json();
```

### Crear un servicio

```javascript
const response = await fetch('/api/v1/services', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Sesión de fotos profesional',
    description: 'Sesión de 2 horas con retoque',
    price: 150000,
    duration: '2 horas',
    category: 'Fotografía'
  })
});

const { data: service } = await response.json();
```

### Agregar producto a la tienda

```javascript
const response = await fetch('/api/v1/store', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Pintura al óleo',
    description: 'Paisaje abstracto',
    category: 'pintura',
    price: 500000,
    dimensions: '50cm x 70cm',
    materials: ['Óleo', 'Lienzo'],
    year: 2024,
    stock: 1
  })
});

const { data: product } = await response.json();
```

---

## Notas Importantes

1. **Slugs automáticos**: Los slugs se generan automáticamente a partir del título en las publicaciones del blog
2. **Tiempo de lectura**: Se calcula automáticamente basado en el contenido (200 palabras/minuto)
3. **Fotos destacadas**: Máximo 4 fotos pueden estar marcadas como destacadas
4. **Visibilidad**: Las publicaciones en draft no aparecen en listados públicos
5. **Soft delete**: Considera implementar soft delete en producción para recuperar contenido eliminado
