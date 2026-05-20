import express from 'express';
import { createInscription, getAllInscriptions, getInscriptionById } from '../controllers/inscription.controller.js';
import { authenticate } from '../middewares/authenticate.js';
import { validateData } from '../middewares/validation.js';
import { inscriptionSchema } from '../middewares/inscriptionvalidation.js';

const router = express.Router();

// POST /api/inscriptions (public)
router.post('/', validateData(inscriptionSchema), createInscription);

// GET /api/inscriptions (admin)
router.get('/', authenticate, getAllInscriptions);

// GET /api/inscriptions/:id (admin)
router.get('/:id', authenticate, getInscriptionById);

export default router;
