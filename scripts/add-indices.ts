#!/usr/bin/env tsx
/**
 * Script para agregar índices de optimización a la base de datos
 * Ejecutar con: npm run db:add-indices
 * o: tsx scripts/add-indices.ts
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db, dbReady } from '../src/db.js';
import { logger } from '../src/utils/logger.js';

async function addIndices() {
  if (!dbReady) {
    logger.error('Database no está configurada correctamente', undefined, 'Migration');
    process.exit(1);
  }

  logger.info('Iniciando creación de índices de optimización...', undefined, 'Migration');

  try {
    // Usuarios
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_city ON users(city)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_is_available ON users(is_available)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)`);
    logger.info('✓ Índices de users creados', undefined, 'Migration');

    // Artistas
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_artists_category_id ON artists(category_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_artists_base_city ON artists(base_city)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_artists_is_available ON artists(is_available)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_artists_is_verified ON artists(is_verified)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_artists_rating ON artists(rating DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_artists_created_at ON artists(created_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_artists_artist_name ON artists(artist_name)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_artists_tags ON artists USING GIN(tags)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_artists_subcategories ON artists USING GIN(subcategories)`);
    logger.info('✓ Índices de artists creados', undefined, 'Migration');

    // Compañías
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_companies_company_type ON companies(company_type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_companies_is_verified ON companies(is_verified)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_companies_rating ON companies(rating DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_companies_categories ON companies USING GIN(categories)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_companies_tags ON companies USING GIN(tags)`);
    logger.info('✓ Índices de companies creados', undefined, 'Migration');

    // Eventos
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_company_id ON events(company_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_city ON events(city)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_published_at ON events(published_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_upcoming ON events(status, start_date) WHERE status = 'published'`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN(tags)`);
    logger.info('✓ Índices de events creados', undefined, 'Migration');

    // Blog posts
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_visibility ON blog_posts(visibility)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_is_featured ON blog_posts(is_featured)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_public ON blog_posts(visibility, published_at DESC) WHERE visibility = 'public'`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags)`);
    logger.info('✓ Índices de blog_posts creados', undefined, 'Migration');

    // Gallery
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_gallery_user_id ON gallery(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_gallery_is_public ON gallery(is_public)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery(created_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_gallery_tags ON gallery USING GIN(tags)`);
    logger.info('✓ Índices de gallery creados', undefined, 'Migration');

    // Featured items
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_featured_items_user_id ON featured_items(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_featured_items_type ON featured_items(type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_featured_items_created_at ON featured_items(created_at DESC)`);
    logger.info('✓ Índices de featured_items creados', undefined, 'Migration');

    // Favorites
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_favorites_artist_id ON favorites(artist_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_favorites_event_id ON favorites(event_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_favorites_venue_id ON favorites(venue_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_favorites_user_type ON favorites(user_id, type)`);
    logger.info('✓ Índices de favorites creados', undefined, 'Migration');

    // Saved items
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_saved_items_post_id ON saved_items(post_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_saved_items_saved_at ON saved_items(saved_at DESC)`);
    logger.info('✓ Índices de saved_items creados', undefined, 'Migration');

    // Blog comments
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_comments_author_id ON blog_comments(author_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON blog_comments(parent_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at ON blog_comments(created_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_comments_post_date ON blog_comments(post_id, created_at DESC)`);
    logger.info('✓ Índices de blog_comments creados', undefined, 'Migration');

    // Reviews
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reviews_artist_id ON reviews(artist_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reviews_event_id ON reviews(event_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reviews_venue_id ON reviews(venue_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reviews_type ON reviews(type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC)`);
    logger.info('✓ Índices de reviews creados', undefined, 'Migration');

    // Offers
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_offers_client_id ON offers(client_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_offers_artist_id ON offers(artist_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_offers_category ON offers(category)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_offers_event_date ON offers(event_date)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_offers_client_status ON offers(client_id, status)`);
    logger.info('✓ Índices de offers creados', undefined, 'Migration');

    // Messages
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_received_unread ON messages(receiver_id, is_read) WHERE is_read = false`);
    logger.info('✓ Índices de messages creados', undefined, 'Migration');

    // Venues
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_venues_company_id ON venues(company_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_venues_is_available ON venues(is_available)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_venues_rating ON venues(rating DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_venues_services ON venues USING GIN(services)`);
    logger.info('✓ Índices de venues creados', undefined, 'Migration');

    // Hiring requests
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hiring_requests_client_id ON hiring_requests(client_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hiring_requests_artist_id ON hiring_requests(artist_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hiring_requests_status ON hiring_requests(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hiring_requests_event_date ON hiring_requests(event_date)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hiring_requests_created_at ON hiring_requests(created_at DESC)`);
    logger.info('✓ Índices de hiring_requests creados', undefined, 'Migration');

    // Hiring responses
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hiring_responses_request_id ON hiring_responses(request_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hiring_responses_artist_id ON hiring_responses(artist_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hiring_responses_status ON hiring_responses(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_hiring_responses_created_at ON hiring_responses(created_at DESC)`);
    logger.info('✓ Índices de hiring_responses creados', undefined, 'Migration');

    // Recommendations
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_recommendations_artist_id ON recommendations(artist_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_recommendations_event_id ON recommendations(event_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_recommendations_is_active ON recommendations(is_active)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at DESC)`);
    logger.info('✓ Índices de recommendations creados', undefined, 'Migration');

    // Blog post likes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_post_likes_post_id ON blog_post_likes(post_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_blog_post_likes_user_id ON blog_post_likes(user_id)`);
    logger.info('✓ Índices de blog_post_likes creados', undefined, 'Migration');

    // Event occurrences
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_event_occurrences_event_id ON event_occurrences(event_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_event_occurrences_start_date ON event_occurrences(start_date)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_event_occurrences_status ON event_occurrences(status)`);
    logger.info('✓ Índices de event_occurrences creados', undefined, 'Migration');

    logger.info('✅ Todos los índices de optimización han sido creados exitosamente', undefined, 'Migration');

    // Mostrar estadísticas de índices
    const indicesResult = await db.execute(sql`
      SELECT
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    logger.info(`Total de índices en la base de datos: ${indicesResult.rows.length}`, undefined, 'Migration');

  } catch (error) {
    logger.error('Error al crear índices', error as Error, 'Migration');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  addIndices()
    .then(() => {
      logger.info('Script completado exitosamente', undefined, 'Migration');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error en el script', error, 'Migration');
      process.exit(1);
    });
}

export { addIndices };
