import express from 'express';
import {
    getAllFormations,
    getFormationById,
    createFormation,
    updateFormation,
    deleteFormation,
} from '../controllers/formation.controller.js';
import { authenticate } from '../middewares/authenticate.js';
import { validateData } from '../middewares/validation.js';
import { formationSchema } from '../middewares/formationvalidation.js';

const router = express.Router();

// GET /api/formations
router.get('/', getAllFormations);

// GET /api/formations/:id
router.get('/:id', getFormationById);

// POST /api/formations (admin)
router.post('/', authenticate, validateData(formationSchema), createFormation);

// PUT /api/formations/:id (admin)
router.put('/:id', authenticate, validateData(formationSchema), updateFormation);

// DELETE /api/formations/:id (admin)
router.delete('/:id', authenticate, deleteFormation);

export default router;
