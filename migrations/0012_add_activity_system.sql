-- Migración: Sistema de Actividades, Notificaciones y Logros
-- Fecha: 2025-01-21
-- Descripción: Agrega tablas para actividad del usuario, notificaciones, seguidores, vistas y logros

-- Tabla de actividades del usuario
CREATE TABLE IF NOT EXISTS user_activities (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN (
    'profile_view', 'follow', 'unfollow', 'comment', 'like',
    'review', 'contract', 'recommendation', 'profile_update',
    'portfolio_update', 'achievement'
  )),
  entity_type VARCHAR,
  entity_id VARCHAR,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para user_activities
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_actor_id ON user_activities(actor_id);
CREATE INDEX idx_user_activities_type ON user_activities(type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX idx_user_activities_is_read ON user_activities(is_read);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN (
    'follow', 'comment', 'like', 'review', 'contract', 'message', 'system'
  )),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR,
  is_read BOOLEAN DEFAULT FALSE,
  priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- Índices para notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Tabla de seguidores
CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

-- Índices para follows
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_created_at ON follows(created_at DESC);

-- Tabla de vistas de perfil
CREATE TABLE IF NOT EXISTS profile_views (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewer_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  viewer_ip VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para profile_views
CREATE INDEX idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX idx_profile_views_viewer_id ON profile_views(viewer_id);
CREATE INDEX idx_profile_views_created_at ON profile_views(created_at DESC);

-- Tabla de logros
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  code VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR,
  category VARCHAR CHECK (category IN ('profile', 'social', 'work', 'milestone')),
  points INTEGER DEFAULT 0,
  requirement JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de logros desbloqueados por usuarios
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notified BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, achievement_id)
);

-- Índices para user_achievements
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

-- Insertar logros predefinidos
INSERT INTO achievements (code, name, description, icon, category, points, requirement) VALUES
('first_profile', '¡Bienvenido!', 'Completaste tu perfil por primera vez', '👋', 'profile', 10, '{"profileComplete": true}'),
('first_follower', 'Primera Conexión', 'Conseguiste tu primer seguidor', '👥', 'social', 20, '{"followers": 1}'),
('10_followers', 'Influencer Emergente', 'Alcanzaste 10 seguidores', '⭐', 'social', 50, '{"followers": 10}'),
('50_followers', 'Comunidad Activa', 'Alcanzaste 50 seguidores', '🌟', 'social', 100, '{"followers": 50}'),
('100_followers', 'Referente', 'Alcanzaste 100 seguidores', '🏆', 'social', 200, '{"followers": 100}'),
('first_review', 'Primera Impresión', 'Recibiste tu primera reseña', '📝', 'work', 30, '{"reviews": 1}'),
('5_star_rating', 'Excelencia', 'Alcanzaste 5 estrellas de rating', '⭐⭐⭐⭐⭐', 'work', 150, '{"rating": 5}'),
('first_contract', 'Primer Trabajo', 'Completaste tu primer contrato', '💼', 'work', 100, '{"contracts": 1}'),
('10_contracts', 'Profesional', 'Completaste 10 contratos', '🎯', 'work', 250, '{"contracts": 10}'),
('profile_complete', 'Perfil Completo', 'Completaste el 100% de tu perfil', '✅', 'profile', 50, '{"profileCompleteness": 100}'),
('portfolio_rich', 'Portafolio Rico', 'Agregaste 10 trabajos a tu portafolio', '🎨', 'profile', 75, '{"portfolioItems": 10}')
ON CONFLICT (code) DO NOTHING;

-- Comentarios en las tablas
COMMENT ON TABLE user_activities IS 'Registro de todas las actividades del usuario para el feed de actividad reciente';
COMMENT ON TABLE notifications IS 'Notificaciones del sistema para el usuario';
COMMENT ON TABLE follows IS 'Relación de seguidores entre usuarios';
COMMENT ON TABLE profile_views IS 'Registro de visitas a perfiles de usuarios';
COMMENT ON TABLE achievements IS 'Catálogo de logros disponibles en la plataforma';
COMMENT ON TABLE user_achievements IS 'Logros desbloqueados por cada usuario';
