import express from 'express';
import {
    getAllRealisations,
    getRealisationById,
    createRealisation,
    updateRealisation,
    deleteRealisation,
} from '../controllers/realisation.controller.js';
import { authenticate } from '../middewares/authenticate.js';
import { validateData } from '../middewares/validation.js';
import { realisationSchema } from '../middewares/realisationvalidation.js';
import { uploadMultiple } from '../middewares/upload.js';

const router = express.Router();

// GET /api/realisations
router.get('/', getAllRealisations);

// GET /api/realisations/:id
router.get('/:id', getRealisationById);

// POST /api/realisations (admin) - with multiple image uploads
router.post('/', authenticate, uploadMultiple, createRealisation);

// PUT /api/realisations/:id (admin) - with multiple image uploads
router.put('/:id', authenticate, uploadMultiple, updateRealisation);

// DELETE /api/realisations/:id (admin)
router.delete('/:id', authenticate, deleteRealisation);

export default router;
