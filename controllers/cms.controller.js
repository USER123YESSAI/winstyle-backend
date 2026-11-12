import jwt from 'jsonwebtoken';
import CmsSection from '../models/cms_section.model.js';
import { DEFAULT_CMS_SECTIONS } from '../config/cmsDefaults.js';
import { logActivity } from '../middewares/logger.js';

let seededOnce = false;

export const ensureCmsDefaultsSeeded = async () => {
    try {
        const existing = await CmsSection.findAll({ attributes: ['section_key'] });
        const existingKeys = new Set(existing.map((r) => r.section_key));

        const missing = DEFAULT_CMS_SECTIONS.filter((s) => !existingKeys.has(s.section_key));
        if (missing.length > 0) {
            await CmsSection.bulkCreate(missing);
        }
        seededOnce = true;
    } catch (error) {
        console.error('Erreur initialisation CMS par défaut:', error.message);
    }
};

const isPreviewAuthorized = (req) => {
    if (req.query.preview !== '1' && req.query.preview !== 'true') return false;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.split(' ')[1];
    try {
        jwt.verify(token, process.env.SECRET_KEY || process.env.JWT_SECRET);
        return true;
    } catch {
        return false;
    }
};

// ── Public : récupérer toutes les sections CMS pour le site public (ou aperçu brouillon si admin) ──
export const getPublicCms = async (req, res) => {
    try {
        if (!seededOnce) {
            await ensureCmsDefaultsSeeded();
        }
        const rows = await CmsSection.findAll({
            order: [['ordre', 'ASC'], ['id', 'ASC']],
        });

        // Si la table a été vidée entre-temps
        if (rows.length === 0) {
            await ensureCmsDefaultsSeeded();
        }

        const finalRows = rows.length > 0
            ? rows
            : await CmsSection.findAll({ order: [['ordre', 'ASC'], ['id', 'ASC']] });

        const previewMode = isPreviewAuthorized(req);
        const sections = {};

        for (const row of finalRows) {
            const effectiveContent =
                previewMode && row.draft_content
                    ? row.draft_content
                    : row.content;

            sections[row.section_key] = {
                section_key: row.section_key,
                title: row.title,
                actif: row.actif,
                statut: row.statut,
                ordre: row.ordre,
                content: effectiveContent,
                updatedAt: row.updatedAt,
            };
        }

        return res.status(200).json({
            preview: previewMode,
            data: sections,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Erreur lors du chargement des contenus du site',
            error: error.message,
        });
    }
};

// ── Admin : récupérer toutes les sections CMS avec brouillons ──
export const getAdminCms = async (req, res) => {
    try {
        await ensureCmsDefaultsSeeded();
        const rows = await CmsSection.findAll({
            order: [['ordre', 'ASC'], ['id', 'ASC']],
        });
        return res.status(200).json({ data: rows });
    } catch (error) {
        return res.status(500).json({
            message: 'Erreur lors du chargement du CMS admin',
            error: error.message,
        });
    }
};

// ── Admin : enregistrer ou publier une section CMS ──
export const updateCmsSection = async (req, res) => {
    try {
        await ensureCmsDefaultsSeeded();
        const { key } = req.params;
        const { title, actif, ordre, content, publish } = req.body;

        let section = await CmsSection.findOne({ where: { section_key: key } });
        if (!section) {
            const defaultDef = DEFAULT_CMS_SECTIONS.find((s) => s.section_key === key);
            section = await CmsSection.create({
                section_key: key,
                title: title || defaultDef?.title || key,
                actif: actif !== undefined ? actif : true,
                statut: publish === false ? 'brouillon' : 'publie',
                ordre: ordre !== undefined ? ordre : defaultDef?.ordre || 99,
                content: publish === false ? (defaultDef?.content || content) : content,
                draft_content: publish === false ? content : null,
                updatedBy: req.user?.email || 'admin',
            });
        } else {
            const updates = {
                updatedBy: req.user?.email || 'admin',
            };
            if (title !== undefined) updates.title = title;
            if (actif !== undefined) updates.actif = actif;
            if (ordre !== undefined) updates.ordre = ordre;

            if (publish === false) {
                updates.draft_content = content;
                updates.statut = 'brouillon';
            } else {
                updates.content = content;
                updates.draft_content = null;
                updates.statut = 'publie';
            }

            await section.update(updates);
        }

        await logActivity(
            req.user,
            publish === false ? 'Brouillon CMS enregistré' : 'Section CMS publiée',
            `${section.title} (${section.section_key})`,
            req
        );

        return res.status(200).json({
            message:
                publish === false
                    ? 'Brouillon enregistré avec succès. Vous pouvez le prévisualiser avant publication.'
                    : 'Modifications publiées et visibles immédiatement sur le site public !',
            data: section,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Erreur lors de la sauvegarde de la section CMS',
            error: error.message,
        });
    }
};

// ── Admin : publier le brouillon d'une section ──
export const publishCmsSection = async (req, res) => {
    try {
        const { key } = req.params;
        const section = await CmsSection.findOne({ where: { section_key: key } });
        if (!section) {
            return res.status(404).json({ message: 'Section CMS introuvable' });
        }

        const newContent = section.draft_content || section.content;
        await section.update({
            content: newContent,
            draft_content: null,
            statut: 'publie',
            updatedBy: req.user?.email || 'admin',
        });

        await logActivity(
            req.user,
            'Brouillon CMS publié',
            `${section.title} (${section.section_key})`,
            req
        );

        return res.status(200).json({
            message: 'Le brouillon a été publié sur le site public !',
            data: section,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Erreur lors de la publication du brouillon',
            error: error.message,
        });
    }
};

// ── Admin : abandonner le brouillon d'une section ──
export const discardCmsDraft = async (req, res) => {
    try {
        const { key } = req.params;
        const section = await CmsSection.findOne({ where: { section_key: key } });
        if (!section) {
            return res.status(404).json({ message: 'Section CMS introuvable' });
        }

        await section.update({
            draft_content: null,
            statut: 'publie',
            updatedBy: req.user?.email || 'admin',
        });

        return res.status(200).json({
            message: 'Brouillon annulé. La version publiée a été restaurée.',
            data: section,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de l'annulation du brouillon",
            error: error.message,
        });
    }
};

// ── Admin : activer / désactiver une section CMS ──
export const toggleCmsSection = async (req, res) => {
    try {
        const { key } = req.params;
        const section = await CmsSection.findOne({ where: { section_key: key } });
        if (!section) {
            return res.status(404).json({ message: 'Section CMS introuvable' });
        }

        await section.update({
            actif: !section.actif,
            updatedBy: req.user?.email || 'admin',
        });

        await logActivity(
            req.user,
            section.actif ? 'Section CMS activée' : 'Section CMS désactivée',
            `${section.title} (${section.section_key})`,
            req
        );

        return res.status(200).json({
            message: section.actif
                ? 'Section activée sur le site public'
                : 'Section masquée sur le site public',
            data: section,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Erreur lors du changement de statut de la section',
            error: error.message,
        });
    }
};

// ── Admin : téléverser un média / image pour le CMS ──
export const uploadCmsMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier image fourni.' });
        }
        const url = `/uploads/${req.file.filename}`;

        await logActivity(req.user, 'Média CMS téléversé', url, req);

        return res.status(201).json({
            message: 'Image téléversée avec succès',
            url,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors du téléversement de l'image",
            error: error.message,
        });
    }
};
