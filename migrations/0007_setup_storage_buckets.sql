-- Migración para configurar los buckets de Supabase Storage
-- Ejecutar esta migración en el SQL Editor de Supabase

-- =====================================================
-- BUCKETS DE STORAGE
-- =====================================================

-- Crear bucket para posts (publicaciones de usuarios)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true, -- Público para que las imágenes sean accesibles
  10485760, -- 10MB límite
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Crear bucket para servicios (imágenes de servicios de artistas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'services',
  'services',
  true,
  10485760, -- 10MB límite
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Crear bucket para productos (imágenes de productos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  10485760, -- 10MB límite
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Crear bucket para portfolios (trabajos de artistas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolios',
  'portfolios',
  true,
  15728640, -- 15MB límite (más grande para portfolios)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Crear bucket para avatares/perfiles
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB límite
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- POLÍTICAS DE ACCESO (RLS - Row Level Security)
-- =====================================================

-- Políticas para POSTS
-- Permitir lectura pública
CREATE POLICY "Public read access for posts"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

-- Permitir subida solo a usuarios autenticados
CREATE POLICY "Authenticated users can upload posts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts'
  AND auth.role() = 'authenticated'
);

-- Permitir actualización solo al propietario
CREATE POLICY "Users can update their own posts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir eliminación solo al propietario
CREATE POLICY "Users can delete their own posts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas para SERVICES
CREATE POLICY "Public read access for services"
ON storage.objects FOR SELECT
USING (bucket_id = 'services');

CREATE POLICY "Authenticated users can upload services"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'services'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own services"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'services'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own services"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'services'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas para PRODUCTS
CREATE POLICY "Public read access for products"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload products"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own products"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own products"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas para PORTFOLIOS
CREATE POLICY "Public read access for portfolios"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolios');

CREATE POLICY "Authenticated users can upload portfolios"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolios'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own portfolios"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolios'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own portfolios"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolios'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas para AVATARS
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
