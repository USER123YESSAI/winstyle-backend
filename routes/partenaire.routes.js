import express from 'express';
import {
    getPublicPartenaires,
    getAllPartenairesAdmin,
    createPartenaire,
    updatePartenaire,
    togglePartenaireActif,
    reorderPartenaires,
    deletePartenaire,
} from '../controllers/partenaire.controller.js';
import { authenticate } from '../middewares/authenticate.js';
import { validateData } from '../middewares/validation.js';
import { partenaireSchema, reorderSchema } from '../middewares/partenairevalidation.js';
import upload from '../middewares/upload.js';

const router = express.Router();

// GET /api/partenaires (public — actifs uniquement)
router.get('/', getPublicPartenaires);

// GET /api/partenaires/admin (admin — tous)
router.get('/admin', authenticate, getAllPartenairesAdmin);

// PATCH /api/partenaires/reorder (admin — réorganiser l'ordre)
router.patch('/reorder', authenticate, validateData(reorderSchema), reorderPartenaires);

// POST /api/partenaires (admin — avec upload logo)
router.post('/', authenticate, upload.single('logo'), validateData(partenaireSchema), createPartenaire);

// PUT /api/partenaires/:id (admin — avec upload logo optionnel)
router.put('/:id', authenticate, upload.single('logo'), validateData(partenaireSchema), updatePartenaire);

// PATCH /api/partenaires/:id/toggle (admin — activer/désactiver)
router.patch('/:id/toggle', authenticate, togglePartenaireActif);

// DELETE /api/partenaires/:id (admin)
router.delete('/:id', authenticate, deletePartenaire);

export default router;
