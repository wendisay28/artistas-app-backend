import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    // Check onboarding data and social_media for real users (not demo_)
    const users = await pool.query(`
      SELECT id, display_name, email, user_type,
             onboarding_data, social_media, linked_accounts,
             stage_name, category_id, description, bio, short_bio
      FROM users
      WHERE id NOT LIKE 'demo_%'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log('Real users:', users.rowCount);
    users.rows.forEach(r => {
      console.log({
        id: r.id.slice(0, 10),
        email: r.email?.slice(0, 20),
        type: r.user_type,
        stage_name: r.stage_name,
        category_id: r.category_id,
        description: r.description?.slice(0, 40),
        bio: r.bio?.slice(0, 40),
        short_bio: r.short_bio,
        has_onboarding: !!r.onboarding_data,
        onboarding_keys: r.onboarding_data ? Object.keys(r.onboarding_data) : [],
        social_media: r.social_media,
      });
    });
  } catch(e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}
check();
