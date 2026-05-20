import express from 'express';
import { createContact, getAllContacts } from '../controllers/contact.controller.js';
import { authenticate } from '../middewares/authenticate.js';
import { validateData } from '../middewares/validation.js';
import { contactSchema } from '../middewares/contactvalidation.js';

const router = express.Router();

// POST /api/contact (public)
router.post('/', validateData(contactSchema), createContact);

// GET /api/contact (admin)
router.get('/', authenticate, getAllContacts);

export default router;
