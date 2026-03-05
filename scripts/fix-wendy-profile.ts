import { db } from '../src/db';
import { artists } from '../src/schema';
import { sql } from 'drizzle-orm';

async function fixWendyProfile() {
  console.log('🔧 Arreglando perfil de Wendy...');
  
  try {
    // Actualizar el perfil de Wendy moviendo el bio a description
    const updated = await db
      .update(artists)
      .set({
        description: sql`(SELECT bio FROM artists WHERE user_id = 'aJKaLH86nfOfMDCFpIBYkal6ZE22')`,
      })
      .where(sql`user_id = 'aJKaLH86nfOfMDCFpIBYkal6ZE22'`)
      .returning();
    
    console.log('✅ Perfil de Wendy actualizado:', {
      id: updated[0].id,
      description: updated[0].description,
      bio: updated[0].bio
    });
    
  } catch (error) {
    console.error('❌ Error al arreglar perfil:', error);
    process.exit(1);
  }
}

fixWendyProfile().then(() => {
  process.exit(0);
});
