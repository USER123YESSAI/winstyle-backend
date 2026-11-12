import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
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
import partenaireRoutes from './routes/partenaire.routes.js';
import temoignageRoutes from './routes/temoignage.routes.js';
import cmsRoutes from './routes/cms.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

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

app.use(express.json({ limit: '2mb' }));

if (process.env.NODE_ENV !== 'test') {
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  });
  app.use('/api/auth/login', loginLimiter);

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Trop de requêtes depuis cette adresse IP. Réessayez plus tard.' },
  });
  app.use('/api', apiLimiter);
}

app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox");
  next();
}, express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/partenaires', partenaireRoutes);
app.use('/api/temoignages', temoignageRoutes);
app.use('/api/cms', cmsRoutes);

// Gestionnaire global d'erreurs (Multer, CORS, erreurs serveur)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Le fichier dépasse la taille maximale autorisée (5 Mo).' });
    }
    return res.status(400).json({ message: `Erreur d'upload : ${err.message}` });
  }
  if (err?.status === 400 || err?.message?.includes('Format de fichier')) {
    return res.status(400).json({ message: err.message });
  }
  if (err?.message?.startsWith('CORS blocked')) {
    return res.status(403).json({ message: err.message });
  }
  console.error('Erreur non gérée :', err);
  return res.status(500).json({ message: 'Erreur interne du serveur' });
});

export default app;
