-- Agregar índices para optimización de consultas
-- Ejecutar con: psql $DATABASE_URL < src/migrations/add-performance-indices.sql

-- Índices para la tabla users (búsquedas frecuentes)
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_is_available ON users(is_available);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Índices para la tabla artists (búsquedas y filtrado)
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);
CREATE INDEX IF NOT EXISTS idx_artists_category_id ON artists(category_id);
CREATE INDEX IF NOT EXISTS idx_artists_base_city ON artists(base_city);
CREATE INDEX IF NOT EXISTS idx_artists_is_available ON artists(is_available);
CREATE INDEX IF NOT EXISTS idx_artists_is_verified ON artists(is_verified);
CREATE INDEX IF NOT EXISTS idx_artists_rating ON artists(rating DESC);
CREATE INDEX IF NOT EXISTS idx_artists_created_at ON artists(created_at DESC);
-- Índice para búsquedas por nombre
CREATE INDEX IF NOT EXISTS idx_artists_artist_name ON artists(artist_name);
-- Índice GIN para búsquedas en arrays
CREATE INDEX IF NOT EXISTS idx_artists_tags ON artists USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_artists_subcategories ON artists USING GIN(subcategories);

-- Índices para la tabla companies (búsquedas)
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city);
CREATE INDEX IF NOT EXISTS idx_companies_company_type ON companies(company_type);
CREATE INDEX IF NOT EXISTS idx_companies_is_verified ON companies(is_verified);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_rating ON companies(rating DESC);
-- Índice GIN para arrays
CREATE INDEX IF NOT EXISTS idx_companies_categories ON companies USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_companies_tags ON companies USING GIN(tags);

-- Índices para la tabla events (búsquedas y filtrado por fecha)
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_company_id ON events(company_id);
CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_events_published_at ON events(published_at DESC);
-- Índice compuesto para eventos próximos publicados
CREATE INDEX IF NOT EXISTS idx_events_upcoming ON events(status, start_date) WHERE status = 'published';
-- Índice GIN para arrays
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN(tags);

-- Índices para la tabla blog_posts (búsquedas y filtrado)
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_visibility ON blog_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_featured ON blog_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
-- Índice compuesto para posts públicos
CREATE INDEX IF NOT EXISTS idx_blog_posts_public ON blog_posts(visibility, published_at DESC) WHERE visibility = 'public';
-- Índice GIN para arrays
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- Índices para la tabla gallery (consultas por usuario)
CREATE INDEX IF NOT EXISTS idx_gallery_user_id ON gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_is_public ON gallery(is_public);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery(created_at DESC);
-- Índice GIN para tags
CREATE INDEX IF NOT EXISTS idx_gallery_tags ON gallery USING GIN(tags);

-- Índices para la tabla featured_items (consultas por usuario)
CREATE INDEX IF NOT EXISTS idx_featured_items_user_id ON featured_items(user_id);
CREATE INDEX IF NOT EXISTS idx_featured_items_type ON featured_items(type);
CREATE INDEX IF NOT EXISTS idx_featured_items_created_at ON featured_items(created_at DESC);

-- Índices para la tabla favorites (consultas por usuario y tipo)
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_artist_id ON favorites(artist_id);
CREATE INDEX IF NOT EXISTS idx_favorites_event_id ON favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_favorites_venue_id ON favorites(venue_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);
-- Índice compuesto para buscar favoritos de un usuario por tipo
CREATE INDEX IF NOT EXISTS idx_favorites_user_type ON favorites(user_id, type);

-- Índices para la tabla saved_items (consultas por usuario)
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_post_id ON saved_items(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_saved_at ON saved_items(saved_at DESC);
-- Ya existe uniqueIndex('user_post_idx') en la definición del schema

-- Índices para la tabla blog_comments (consultas por post y autor)
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_author_id ON blog_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at ON blog_comments(created_at DESC);
-- Índice compuesto para comentarios de un post ordenados
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_date ON blog_comments(post_id, created_at DESC);

-- Índices para la tabla reviews (consultas por entidad)
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_artist_id ON reviews(artist_id);
CREATE INDEX IF NOT EXISTS idx_reviews_event_id ON reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_reviews_venue_id ON reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_reviews_type ON reviews(type);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Índices para la tabla offers (consultas por cliente y artista)
CREATE INDEX IF NOT EXISTS idx_offers_client_id ON offers(client_id);
CREATE INDEX IF NOT EXISTS idx_offers_artist_id ON offers(artist_id);
CREATE INDEX IF NOT EXISTS idx_offers_category ON offers(category);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_event_date ON offers(event_date);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at DESC);
-- Índice compuesto para ofertas activas de un cliente
CREATE INDEX IF NOT EXISTS idx_offers_client_status ON offers(client_id, status);

-- Índices para la tabla messages (consultas de conversaciones)
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
-- Índice compuesto para conversaciones entre dos usuarios
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_received_unread ON messages(receiver_id, is_read) WHERE is_read = false;

-- Índices para la tabla venues (consultas por compañía y ciudad)
CREATE INDEX IF NOT EXISTS idx_venues_company_id ON venues(company_id);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_is_available ON venues(is_available);
CREATE INDEX IF NOT EXISTS idx_venues_rating ON venues(rating DESC);
-- Índice GIN para services array
CREATE INDEX IF NOT EXISTS idx_venues_services ON venues USING GIN(services);

-- Índices para la tabla hiring_requests (consultas por cliente y artista)
CREATE INDEX IF NOT EXISTS idx_hiring_requests_client_id ON hiring_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_hiring_requests_artist_id ON hiring_requests(artist_id);
CREATE INDEX IF NOT EXISTS idx_hiring_requests_status ON hiring_requests(status);
CREATE INDEX IF NOT EXISTS idx_hiring_requests_event_date ON hiring_requests(event_date);
CREATE INDEX IF NOT EXISTS idx_hiring_requests_created_at ON hiring_requests(created_at DESC);

-- Índices para la tabla hiring_responses (consultas por request y artista)
CREATE INDEX IF NOT EXISTS idx_hiring_responses_request_id ON hiring_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_hiring_responses_artist_id ON hiring_responses(artist_id);
CREATE INDEX IF NOT EXISTS idx_hiring_responses_status ON hiring_responses(status);
CREATE INDEX IF NOT EXISTS idx_hiring_responses_created_at ON hiring_responses(created_at DESC);

-- Índices para la tabla recommendations (consultas por usuario y tipo)
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(type);
CREATE INDEX IF NOT EXISTS idx_recommendations_artist_id ON recommendations(artist_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_event_id ON recommendations(event_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_is_active ON recommendations(is_active);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at DESC);

-- Índices para la tabla blog_post_likes (ya tiene uniqueIndex en el schema)
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_post_id ON blog_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_user_id ON blog_post_likes(user_id);

-- Índices para la tabla event_occurrences (eventos recurrentes)
CREATE INDEX IF NOT EXISTS idx_event_occurrences_event_id ON event_occurrences(event_id);
CREATE INDEX IF NOT EXISTS idx_event_occurrences_start_date ON event_occurrences(start_date);
CREATE INDEX IF NOT EXISTS idx_event_occurrences_status ON event_occurrences(status);

-- Verificar índices creados
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
