
import express from 'express';
import { setupVite } from './vite';
import apiRoutes from './routes/api.routes';
import { db } from './db';
import { storage } from './storage';

const app = express();
app.use(express.json());

// API routes
app.use('/api', apiRoutes);

// Serve frontend
setupVite(app);

const port = 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
