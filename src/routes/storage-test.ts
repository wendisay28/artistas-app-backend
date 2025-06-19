import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../config/firebase';

const router = Router();
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const bucketName = 'buscartpro-ecf88.firebasestorage.app';
    console.log('Using bucket:', bucketName);
    const bucket = storage.bucket(bucketName);
    const fileName = `test/${uuidv4()}-${req.file.originalname}`;
    const file = bucket.file(fileName);

    console.log('Attempting to upload file:', fileName);
    console.log('File mimetype:', req.file.mimetype);
    console.log('File size:', req.file.size);

    // Upload the file
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      }
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    console.log('Upload successful. Public URL:', publicUrl);

    res.json({ 
      message: 'File uploaded successfully',
      fileName,
      publicUrl
    });

  } catch (error) {
    console.error('Storage test error:', error);
    res.status(500).json({ 
      error: 'Storage test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
