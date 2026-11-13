import { Candidature } from '../models/index.js';
import { logActivity } from '../middewares/logger.js';
import { deleteUploadedFile, persistUploadedFile } from '../middewares/upload.js';

export const createCandidature = async (req, res) => {
    try {
        if (req.file) await persistUploadedFile(req.file);
        const { nom, email, telephone, poste } = req.body;
        const cv_url = req.file ? `/uploads/${req.file.filename}` : null;
        const candidature = await Candidature.create({ nom, email, telephone, poste, cv_url });
        return res.status(201).json({ message: 'Candidature envoyée', candidature });
    } catch (error) {
        if (req.file) await deleteUploadedFile(req.file.filename);
        return res.status(400).json({ message: 'Erreur candidature', error: error.message });
    }
};

export const getAllCandidatures = async (req, res) => {
    try {
        const candidatures = await Candidature.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(200).json(candidatures);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const getCandidatureById = async (req, res) => {
    try {
        const candidature = await Candidature.findByPk(req.params.id);
        if (!candidature) return res.status(404).json({ message: 'Candidature introuvable' });
        return res.status(200).json(candidature);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const updateStatutCandidature = async (req, res) => {
    try {
        const candidature = await Candidature.findByPk(req.params.id);
        if (!candidature) return res.status(404).json({ message: 'Candidature introuvable' });

        const ancienStatut = candidature.statut;
        await candidature.update({ statut: req.body.statut });

        await logActivity(
            req.user,
            `Statut candidature modifié : "${ancienStatut}" → "${req.body.statut}"`,
            `Candidature #${candidature.id} — ${candidature.nom}`,
            req
        );

        return res.status(200).json({ message: 'Statut mis à jour', candidature });
    } catch (error) {
        return res.status(400).json({ message: 'Erreur mise à jour', error: error.message });
    }
};

export const deleteCandidature = async (req, res) => {
    try {
        const candidature = await Candidature.findByPk(req.params.id);
        if (!candidature) return res.status(404).json({ message: 'Candidature introuvable' });

        const cvUrl = candidature.cv_url;

        await logActivity(
            req.user,
            'Candidature supprimée',
            `Candidature #${candidature.id} — ${candidature.nom} (${candidature.poste})`,
            req
        );

        await candidature.destroy();
        if (cvUrl) await deleteUploadedFile(cvUrl);
        return res.status(200).json({ message: 'Candidature supprimée' });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur suppression' });
    }
};
