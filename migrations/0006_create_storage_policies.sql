-- ============================================
-- MIGRACIÓN: 0006_create_storage_policies.sql
-- DESCRIPCIÓN: Configuración de políticas para Supabase Storage
-- ============================================

-- NOTA IMPORTANTE:
-- Este archivo es solo de referencia. Las políticas de almacenamiento
-- deben configurarse manualmente en la interfaz de Supabase:
-- 1. Ve a la consola de Supabase
-- 2. Navega a "Storage" > "Policies"
-- 3. Para cada bucket ('posts', 'services', 'products'), configura las siguientes políticas:

-- ============================================
-- 1. POLÍTICAS PARA EL BUCKET 'posts'
-- ============================================
-- Nombre: "Permitir subida de posts"
-- Acción: INSERT
-- Roles: authenticated
-- Expresión: bucket_id = 'posts'

-- Nombre: "Permitir lectura pública de posts"
-- Acción: SELECT
-- Roles: public
-- Expresión: bucket_id = 'posts'

-- Nombre: "Permitir actualización de posts"
-- Acción: UPDATE
-- Roles: authenticated
-- Expresión: bucket_id = 'posts' AND auth.uid() = owner

-- Nombre: "Permitir eliminación de posts"
-- Acción: DELETE
-- Roles: authenticated
-- Expresión: bucket_id = 'posts' AND auth.uid() = owner

-- ============================================
-- 2. POLÍTICAS PARA EL BUCKET 'services'
-- ============================================
-- Mismas políticas que para 'posts', pero con bucket_id = 'services'

-- ============================================
-- 3. POLÍTICAS PARA EL BUCKET 'products'
-- ============================================
-- Mismas políticas que para 'posts', pero con bucket_id = 'products'

-- ============================================
-- 4. VERIFICACIÓN
-- ============================================
-- Para verificar las políticas creadas, ejecuta:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage';

-- Para ver los buckets existentes:
-- SELECT * FROM storage.buckets;

-- ============================================
-- 5. CONFIGURACIÓN ADICIONAL
-- ============================================
-- Asegúrate de que los buckets tengan habilitado RLS (Row Level Security)
-- y que estén configurados como públicos si es necesario para tu caso de uso.
