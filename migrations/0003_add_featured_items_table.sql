-- Add up migration script here

-- Crear la tabla de elementos destacados
CREATE TABLE IF NOT EXISTS featured_items (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('youtube', 'spotify', 'vimeo', 'soundcloud', 'other')),
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Referencia a la tabla de usuarios
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Crear índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_featured_items_user_id ON featured_items(user_id);

-- Agregar comentarios a la tabla y columnas
COMMENT ON TABLE featured_items IS 'Almacena los elementos destacados de los usuarios, como enlaces a videos o música';
COMMENT ON COLUMN featured_items.user_id IS 'ID del usuario propietario del elemento destacado';
COMMENT ON COLUMN featured_items.title IS 'Título del elemento destacado';
COMMENT ON COLUMN featured_items.description IS 'Descripción opcional del elemento';
COMMENT ON COLUMN featured_items.url IS 'URL del contenido embebido o enlace';
COMMENT ON COLUMN featured_items.type IS 'Tipo de contenido (youtube, spotify, etc.)';
COMMENT ON COLUMN featured_items.thumbnail_url IS 'URL de la miniatura del contenido (opcional)';

-- Actualizar la función de actualización de timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger para actualizar automáticamente updated_at
CREATE TRIGGER update_featured_items_updated_at
BEFORE UPDATE ON featured_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
