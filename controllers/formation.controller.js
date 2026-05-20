import { Formation } from '../models/index.js';
import { logActivity } from '../middewares/logger.js';

export const getAllFormations = async (req, res) => {
    try {
        const formations = await Formation.findAll({ order: [['date', 'ASC']] });
        return res.status(200).json(formations);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

export const getFormationById = async (req, res) => {
    try {
        const formation = await Formation.findByPk(req.params.id);
        if (!formation) return res.status(404).json({ message: 'Formation introuvable' });
        return res.status(200).json(formation);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

export const createFormation = async (req, res) => {
    try {
        const formation = await Formation.create(req.body);
        await logActivity(req.user, 'Formation créée', `Formation #${formation.id} — ${formation.title}`, req);
        return res.status(201).json({ message: 'Formation créée', formation });
    } catch (error) {
        return res.status(400).json({ message: 'Erreur création', error: error.message });
    }
};

export const updateFormation = async (req, res) => {
    try {
        const formation = await Formation.findByPk(req.params.id);
        if (!formation) return res.status(404).json({ message: 'Formation introuvable' });
        await formation.update(req.body);
        await logActivity(req.user, 'Formation modifiée', `Formation #${formation.id} — ${formation.title}`, req);
        return res.status(200).json({ message: 'Formation mise à jour', formation });
    } catch (error) {
        return res.status(400).json({ message: 'Erreur mise à jour', error: error.message });
    }
};

export const deleteFormation = async (req, res) => {
    try {
        const formation = await Formation.findByPk(req.params.id);
        if (!formation) return res.status(404).json({ message: 'Formation introuvable' });
        await logActivity(req.user, 'Formation supprimée', `Formation #${formation.id} — ${formation.title}`, req);
        await formation.destroy();
        return res.status(200).json({ message: 'Formation supprimée' });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur suppression', error: error.message });
    }
};
