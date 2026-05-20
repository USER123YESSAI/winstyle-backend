import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import formationRoutes from './routes/formation.routes.js';
import inscriptionRoutes from './routes/inscription.routes.js';
import candidatureRoutes from './routes/candidature.routes.js';
import serviceRoutes from './routes/service.routes.js';
import contactRoutes from './routes/contact.routes.js';
import realisationRoutes from './routes/realisation.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ 
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3001',
    ];

    // Sans origin (ex: requêtes serveur-à-serveur)
    if (!origin) return callback(null, true);

    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    return res.status(200).json({ message: "Win's Agency API - Bienvenue !" });
});

app.use('/api/auth', authRoutes);
app.use('/api/formations', formationRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/candidatures', candidatureRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/realisations', realisationRoutes);

export default app;
