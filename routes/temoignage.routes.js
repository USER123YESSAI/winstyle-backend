import express from 'express';
import {
    getPublicTemoignages,
    getAllTemoignagesAdmin,
    createTemoignage,
    updateTemoignage,
    toggleTemoignageActif,
    reorderTemoignages,
    deleteTemoignage,
} from '../controllers/temoignage.controller.js';
import { authenticate } from '../middewares/authenticate.js';
import { validateData } from '../middewares/validation.js';
import { temoignageSchema } from '../middewares/temoignagevalidation.js';
import { reorderSchema } from '../middewares/partenairevalidation.js';
import upload from '../middewares/upload.js';

const router = express.Router();

// GET /api/temoignages (public — actifs uniquement)
router.get('/', getPublicTemoignages);

// GET /api/temoignages/admin (admin — tous)
router.get('/admin', authenticate, getAllTemoignagesAdmin);

// PATCH /api/temoignages/reorder (admin — réorganiser l'ordre)
router.patch('/reorder', authenticate, validateData(reorderSchema), reorderTemoignages);

// POST /api/temoignages (admin — avec upload photo)
router.post('/', authenticate, upload.single('photo'), validateData(temoignageSchema), createTemoignage);

// PUT /api/temoignages/:id (admin — avec upload photo optionnel)
router.put('/:id', authenticate, upload.single('photo'), validateData(temoignageSchema), updateTemoignage);

// PATCH /api/temoignages/:id/toggle (admin — activer/désactiver)
router.patch('/:id/toggle', authenticate, toggleTemoignageActif);

// DELETE /api/temoignages/:id (admin)
router.delete('/:id', authenticate, deleteTemoignage);

export default router;
