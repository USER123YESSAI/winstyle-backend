import express from 'express';
import { login, getMe, createAdmin, getAdmins, deleteAdmin, getLogs } from '../controllers/auth.controller.js';
import { validateLogin, validateCreateAdmin } from '../middewares/authvalidation.js';
import { authenticate, isSuperAdmin } from '../middewares/authenticate.js';

const router = express.Router();

router.post('/login',   validateLogin, login);
router.get('/me',       authenticate, getMe);

// ── Superadmin uniquement ──────────────────────────────────────────
router.post('/admins',        authenticate, isSuperAdmin, validateCreateAdmin, createAdmin);
router.get('/admins',         authenticate, isSuperAdmin, getAdmins);
router.delete('/admins/:id',  authenticate, isSuperAdmin, deleteAdmin);
router.get('/logs',           authenticate, isSuperAdmin, getLogs);

export default router;
