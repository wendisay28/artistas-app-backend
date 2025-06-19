import { Router } from 'express';
import { db } from '../config/firebase';

const router = Router();

router.get('/test', async (req, res) => {
  try {
    // Intentar escribir un documento de prueba
    const testDoc = await db.collection('test').add({
      timestamp: new Date(),
      test: true
    });

    // Leer el documento recién creado
    const doc = await testDoc.get();

    // Eliminar el documento de prueba
    await testDoc.delete();

    res.json({ 
      message: 'Firebase connection test successful',
      documentId: testDoc.id,
      documentData: doc.data()
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    res.status(500).json({ 
      error: 'Firebase connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
