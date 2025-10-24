# Guía de Configuración de Supabase para BuscartPro

Esta guía te ayudará a configurar Supabase para tu aplicación BuscartPro, incluyendo Storage, Auth y Email.

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#1-configuración-inicial)
2. [Configuración de Storage](#2-configuración-de-storage)
3. [Configuración de Auth y Emails](#3-configuración-de-auth-y-emails)
4. [Configuración del Backend](#4-configuración-del-backend)
5. [Pruebas](#5-pruebas)

---

## 1. Configuración Inicial

### 1.1 Crear un Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto:
   - Nombre: `BuscartPro`
   - Database Password: (guarda esta contraseña de forma segura)
   - Región: Selecciona la más cercana a Colombia (preferiblemente `South America`)

### 1.2 Obtener Credenciales

Una vez creado el proyecto, obtén las siguientes credenciales desde `Settings > API`:

- **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
- **anon public key**: Clave pública anon
- **service_role key**: Clave de servicio (⚠️ Nunca la expongas en el frontend)

Copia estas credenciales a tu archivo `.env` en el backend:

```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=tu-clave-anon-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-clave-rol-servicio-supabase
```

---

## 2. Configuración de Storage

### 2.1 Ejecutar la Migración de Buckets

1. Ve a `SQL Editor` en tu panel de Supabase
2. Abre el archivo `/backend/migrations/0007_setup_storage_buckets.sql`
3. Copia todo el contenido
4. Pégalo en el SQL Editor de Supabase
5. Haz clic en `Run`

Esto creará los siguientes buckets:
- `posts` - Para publicaciones de usuarios
- `services` - Para imágenes de servicios de artistas
- `products` - Para imágenes de productos
- `portfolios` - Para trabajos de portafolio
- `avatars` - Para fotos de perfil

### 2.2 Verificar que los Buckets se Crearon

1. Ve a `Storage` en el panel izquierdo
2. Deberías ver los 5 buckets creados
3. Todos deben estar marcados como `Public`

### 2.3 Verificar las Políticas RLS

1. En la sección `Storage`, haz clic en cualquier bucket
2. Ve a la pestaña `Policies`
3. Deberías ver 4 políticas por bucket:
   - Public read access
   - Authenticated users can upload
   - Users can update their own files
   - Users can delete their own files

---

## 3. Configuración de Auth y Emails

### 3.1 Configurar Proveedores de Autenticación

1. Ve a `Authentication > Providers`
2. Habilita los proveedores que necesites:
   - **Email** (ya debería estar habilitado)
   - **Google** (opcional)
   - **GitHub** (opcional)

### 3.2 Configurar Email Templates

Supabase envía emails automáticamente para:
- Confirmación de email
- Recuperación de contraseña
- Email change confirmation

#### Personalizar Plantillas:

1. Ve a `Authentication > Email Templates`
2. Personaliza cada plantilla:

**Confirm signup:**
```html
<h2>Confirma tu correo electrónico</h2>
<p>Hola {{ .Email }},</p>
<p>Gracias por registrarte en BuscartPro. Haz clic en el enlace de abajo para confirmar tu correo electrónico:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi correo</a></p>
<p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
```

**Reset password:**
```html
<h2>Recupera tu contraseña</h2>
<p>Hola,</p>
<p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el enlace de abajo:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer mi contraseña</a></p>
<p>Este enlace expirará en 1 hora.</p>
<p>Si no solicitaste esto, ignora este correo.</p>
```

### 3.3 Configurar URL de Redirección

1. Ve a `Authentication > URL Configuration`
2. En `Site URL`, agrega: `http://localhost:5173` (desarrollo)
3. En `Redirect URLs`, agrega:
   ```
   http://localhost:5173/**
   https://tu-dominio-produccion.com/**
   ```

### 3.4 Configurar Email SMTP (Opcional - Para Producción)

Por defecto, Supabase usa su propio servicio de email (limitado a 3 emails por hora en desarrollo).

Para producción, configura tu propio SMTP:

1. Ve a `Settings > Auth`
2. Desplázate hasta `SMTP Settings`
3. Habilita `Enable Custom SMTP`
4. Configura tu proveedor SMTP:
   - **SendGrid**: [https://sendgrid.com](https://sendgrid.com)
   - **Mailgun**: [https://www.mailgun.com](https://www.mailgun.com)
   - **AWS SES**: [https://aws.amazon.com/ses](https://aws.amazon.com/ses)

Ejemplo con SendGrid:
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: TU_API_KEY_DE_SENDGRID
Sender email: noreply@buscartpro.com
Sender name: BuscartPro
```

---

## 4. Configuración del Backend

### 4.1 Actualizar Variables de Entorno

Asegúrate de que tu archivo `/backend/.env` tenga:

```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=tu-clave-anon
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role

# Frontend URL (para emails)
FRONTEND_URL=http://localhost:5173

# Email SMTP (opcional para desarrollo)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu-sendgrid-api-key
SMTP_FROM=noreply@buscartpro.com
```

### 4.2 Verificar Configuración de Supabase

El archivo `/backend/src/config/supabase.ts` ya está configurado para usar estas variables.

### 4.3 Usar los Servicios

#### Subir Archivos:

```typescript
import { uploadMediaFiles } from '../services/storage.service';

// En tu controller
const mediaFiles = await uploadMediaFiles(
  req.files as Express.Multer.File[],
  'posts', // bucket
  req.user.uid // userId
);
```

#### Enviar Emails:

```typescript
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
} from '../services/email.service';

// Email de verificación
await sendVerificationEmail({
  email: user.email,
  token: verificationToken,
  userName: user.firstName
});

// Email de bienvenida
await sendWelcomeEmail({
  email: user.email,
  userName: user.firstName,
  userType: user.userType
});
```

---

## 5. Pruebas

### 5.1 Probar Subida de Archivos

1. Usa Postman o Thunder Client
2. Endpoint: `POST /api/v1/portfolio/upload`
3. Headers: `Authorization: Bearer YOUR_TOKEN`
4. Body: `form-data` con archivos
5. Verifica que los archivos aparezcan en Storage

### 5.2 Probar Emails

En desarrollo, los emails se loguean en la consola:

```
📧 Email simulado enviado:
Para: usuario@example.com
Asunto: Verifica tu correo electrónico - BuscartPro
Contenido HTML: <!DOCTYPE html>...
```

Para probar emails reales:
1. Cambia `NODE_ENV=production` temporalmente
2. Configura SMTP
3. Registra un usuario
4. Verifica que llegue el email

### 5.3 Verificar Storage en Supabase

1. Ve a `Storage` en Supabase
2. Selecciona un bucket (ej: `posts`)
3. Deberías ver las carpetas organizadas por `userId`
4. Haz clic en un archivo para ver su URL pública

---

## 🔒 Seguridad

### Mejores Prácticas:

1. ✅ **Nunca expongas** `SUPABASE_SERVICE_ROLE_KEY` en el frontend
2. ✅ **Usa RLS** (Row Level Security) para todas las tablas
3. ✅ **Organiza archivos** por userId en Storage
4. ✅ **Limita tamaños de archivo** (configurado en la migración)
5. ✅ **Valida tipos MIME** antes de subir
6. ✅ **Usa HTTPS** en producción

### Storage Policies:

Las políticas RLS garantizan que:
- Todos pueden **leer** archivos públicos
- Solo usuarios autenticados pueden **subir** archivos
- Solo el propietario puede **actualizar/eliminar** sus archivos

---

## 🚀 Producción

Antes de ir a producción:

1. [ ] Actualiza `FRONTEND_URL` con tu dominio real
2. [ ] Configura SMTP personalizado
3. [ ] Actualiza `Redirect URLs` en Auth
4. [ ] Verifica límites de Storage (configura alertas)
5. [ ] Habilita backups automáticos en Supabase
6. [ ] Configura un CDN para Storage (opcional)

---

## 📚 Recursos Adicionales

- [Documentación de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Políticas RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

## ❓ Troubleshooting

### Error: "Bucket not found"
**Solución**: Ejecuta la migración `0007_setup_storage_buckets.sql` en el SQL Editor

### Error: "new row violates row-level security policy"
**Solución**: Verifica que las políticas RLS estén creadas correctamente

### Emails no llegan
**Solución**:
- Verifica que el email no esté en spam
- En desarrollo, Supabase limita a 3 emails/hora
- Configura SMTP personalizado

### Archivos muy grandes
**Solución**: Ajusta `file_size_limit` en la migración de buckets

---

¿Necesitas ayuda? Abre un issue en el repositorio. 🎨
