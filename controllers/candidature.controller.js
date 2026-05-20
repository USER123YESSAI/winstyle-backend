import { Candidature } from '../models/index.js';
import { logActivity } from '../middewares/logger.js';

export const createCandidature = async (req, res) => {
    try {
        const cv_url = req.file ? `/uploads/${req.file.filename}` : null;
        const candidature = await Candidature.create({ ...req.body, cv_url });
        return res.status(201).json({ message: 'Candidature envoyée', candidature });
    } catch (error) {
        return res.status(400).json({ message: 'Erreur candidature', error: error.message });
    }
};

export const getAllCandidatures = async (req, res) => {
    try {
        const candidatures = await Candidature.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(200).json(candidatures);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

export const getCandidatureById = async (req, res) => {
    try {
        const candidature = await Candidature.findByPk(req.params.id);
        if (!candidature) return res.status(404).json({ message: 'Candidature introuvable' });
        return res.status(200).json(candidature);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
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

        await logActivity(
            req.user,
            'Candidature supprimée',
            `Candidature #${candidature.id} — ${candidature.nom} (${candidature.poste})`,
            req
        );

        await candidature.destroy();
        return res.status(200).json({ message: 'Candidature supprimée' });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur suppression', error: error.message });
    }
};
