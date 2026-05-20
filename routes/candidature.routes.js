import express from 'express';
import {
    createCandidature,
    getAllCandidatures,
    getCandidatureById,
    updateStatutCandidature,
    deleteCandidature,
} from '../controllers/candidature.controller.js';
import { authenticate } from '../middewares/authenticate.js';
import { validateData } from '../middewares/validation.js';
import { candidatureSchema } from '../middewares/candidaturevalidation.js';
import upload from '../middewares/upload.js';

const router = express.Router();

// POST /api/candidatures (public, avec upload CV)
router.post('/', upload.single('cv'), validateData(candidatureSchema), createCandidature);

// GET /api/candidatures (admin)
router.get('/', authenticate, getAllCandidatures);

// GET /api/candidatures/:id (admin)
router.get('/:id', authenticate, getCandidatureById);

// PATCH /api/candidatures/:id/statut (admin)
router.patch('/:id/statut', authenticate, updateStatutCandidature);

// DELETE /api/candidatures/:id (admin)
router.delete('/:id', authenticate, deleteCandidature);

export default router;
