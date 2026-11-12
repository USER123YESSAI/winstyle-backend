import express from 'express';
import {
    getPublicCms,
    getAdminCms,
    updateCmsSection,
    publishCmsSection,
    discardCmsDraft,
    toggleCmsSection,
    uploadCmsMedia,
} from '../controllers/cms.controller.js';
import { authenticate } from '../middewares/authenticate.js';
import upload from '../middewares/upload.js';
import { cmsUpdateSchema, validateCms } from '../middewares/cmsvalidation.js';

const router = express.Router();

// Route publique (supporte ?preview=1 avec token admin)
router.get('/public', getPublicCms);

// Routes d'administration protégées
router.get('/admin', authenticate, getAdminCms);
router.post('/upload', authenticate, upload.single('image'), uploadCmsMedia);
router.put('/:key', authenticate, validateCms(cmsUpdateSchema), updateCmsSection);
router.post('/:key/publish', authenticate, publishCmsSection);
router.post('/:key/discard-draft', authenticate, discardCmsDraft);
router.patch('/:key/toggle', authenticate, toggleCmsSection);

export default router;
