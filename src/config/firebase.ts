import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Obtener el directorio actual usando import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar el archivo de credenciales
const serviceAccountPath = path.join(__dirname, 'firebase-admin.json');

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error('No se encontró el archivo de credenciales de Firebase Admin');
}

// Leer el archivo de credenciales
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

const firebaseConfig = {
  credential: cert(serviceAccount),
  storageBucket: 'buscartpro-ecf88.firebasestorage.app'
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };