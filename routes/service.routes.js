import express from 'express';
import { createServiceRequest, getAllServiceRequests, getServiceRequestById } from '../controllers/service.controller.js';
import { authenticate } from '../middewares/authenticate.js';
import { validateData } from '../middewares/validation.js';
import { serviceRequestSchema } from '../middewares/servicevalidation.js';

const router = express.Router();

// POST /api/services/request (public)
router.post('/request', validateData(serviceRequestSchema), createServiceRequest);

// GET /api/services (admin)
router.get('/', authenticate, getAllServiceRequests);

// GET /api/services/:id (admin)
router.get('/:id', authenticate, getServiceRequestById);

export default router;
