const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

(async () => {
  try {
    console.log('\n🔍 Verificando buckets de Supabase Storage...\n');

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Error listando buckets:', error);
      return;
    }

    console.log('📦 Buckets encontrados:', buckets.length);
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });

    // Verificar si el bucket 'posts' existe
    const postsBucket = buckets.find(b => b.name === 'posts');

    if (!postsBucket) {
      console.log('\n⚠️  El bucket "posts" NO existe. Necesitas crearlo.');
      console.log('\nPara crear el bucket, ejecuta:');
      console.log('  1. Ve a tu proyecto en Supabase Dashboard');
      console.log('  2. Storage > Buckets');
      console.log('  3. Crea un nuevo bucket llamado "posts"');
      console.log('  4. Configura los permisos apropiados');
    } else {
      console.log('\n✅ El bucket "posts" existe');
      console.log('   Público:', postsBucket.public);
    }

    // Intentar crear bucket si no existe
    if (!postsBucket) {
      console.log('\n🔨 Intentando crear el bucket "posts"...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('posts', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      });

      if (createError) {
        console.error('❌ Error creando bucket:', createError);
      } else {
        console.log('✅ Bucket "posts" creado exitosamente');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
