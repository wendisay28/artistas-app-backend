import { db } from '../src/db';
import { artists } from '../src/schema';
import { eq } from 'drizzle-orm';

async function fixWendyProfile() {
  console.log('🔧 Arreglando perfil de Wendy v2...');
  
  try {
    // Poner tu texto correcto en description
    const wendyText = "hola soy cantante fotógrafa y bailarina, fotógrafa que transforma instantes en historias. Trabajo con luz natural y emoción auténtica para capturar la esencia de cada persona. Creo imágenes honestas, sensibles y poderosas que convierten momentos cotidianos en memorias. Me encanta la fotografía.";
    
    const updated = await db
      .update(artists)
      .set({
        description: wendyText,
      })
      .where(eq(artists.userId, 'aJKaLH86nfOfMDCFpIBYkal6ZE22'))
      .returning();
    
    console.log('✅ Perfil de Wendy actualizado:', {
      id: updated[0].id,
      description: updated[0].description?.substring(0, 100) + '...',
      bio: updated[0].bio?.substring(0, 100) + '...'
    });
    
  } catch (error) {
    console.error('❌ Error al arreglar perfil:', error);
    process.exit(1);
  }
}

fixWendyProfile().then(() => {
  process.exit(0);
});
