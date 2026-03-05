import { db } from '../src/db';
import { artists } from '../src/schema';
import { eq } from 'drizzle-orm';

async function fixWendyFinal() {
  console.log('🔧 Fix final de Wendy - moviendo bio a description...');
  
  try {
    // Primero obtener el bio actual
    const [currentArtist] = await db
      .select()
      .from(artists)
      .where(eq(artists.userId, 'aJKaLH86nfOfMDCFpIBYkal6ZE22'))
      .limit(1);
    
    if (!currentArtist) {
      console.log('❌ No se encontró el artista');
      return;
    }
    
    console.log('📝 Bio actual:', currentArtist.bio?.substring(0, 100) + '...');
    console.log('📝 Description actual:', currentArtist.description);
    
    // Mover bio a description
    const updated = await db
      .update(artists)
      .set({
        description: currentArtist.bio,
      })
      .where(eq(artists.userId, 'aJKaLH86nfOfMDCFpIBYkal6ZE22'))
      .returning();
    
    console.log('✅ Perfil actualizado:', {
      id: updated[0].id,
      description: updated[0].description?.substring(0, 100) + '...',
      bio: updated[0].bio?.substring(0, 100) + '...'
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWendyFinal().then(() => {
  process.exit(0);
});
