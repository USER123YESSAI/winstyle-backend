import { Realisation } from '../models/index.js';
import { logActivity } from '../middewares/logger.js';

// Safe JSON parse helper
const parseImagesSafe = (imagesStr) => {
    if (!imagesStr) return [];
    try {
        const parsed = JSON.parse(imagesStr);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
};

export const getAllRealisations = async (req, res) => {
    try {
        const realisations = await Realisation.findAll({ order: [['date', 'DESC']] });
        const parsed = realisations.map(r => ({
            ...r.toJSON(),
            images: parseImagesSafe(r.images)
        }));
        return res.status(200).json(parsed);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

export const getRealisationById = async (req, res) => {
    try {
        const realisation = await Realisation.findByPk(req.params.id);
        if (!realisation) return res.status(404).json({ message: 'Réalisation introuvable' });
        return res.status(200).json({
            ...realisation.toJSON(),
            images: parseImagesSafe(realisation.images)
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

export const createRealisation = async (req, res) => {
    try {
        const data = { ...req.body };
        
        if (req.files && Array.isArray(req.files)) {
            data.images = JSON.stringify(req.files.map(file => file.filename));
        }
        
        const realisation = await Realisation.create(data);
        await logActivity(req.user, 'Réalisation créée', `Réalisation #${realisation.id} — ${realisation.titre || 'Sans titre'}`, req);
        return res.status(201).json({ 
            message: 'Réalisation créée', 
            realisation: {
                ...realisation.toJSON(),
                images: parseImagesSafe(realisation.images)
            }
        });
    } catch (error) {
        return res.status(400).json({ message: 'Erreur création', error: error.message });
    }
};

export const updateRealisation = async (req, res) => {
    try {
        const realisation = await Realisation.findByPk(req.params.id);
        if (!realisation) return res.status(404).json({ message: 'Réalisation introuvable' });
        
        const data = { ...req.body };
        
        if (req.files && Array.isArray(req.files)) {
            const currentImages = parseImagesSafe(realisation.images);
            const newImages = req.files.map(file => file.filename);
            data.images = JSON.stringify([...currentImages, ...newImages]);
        }
        
        await realisation.update(data);
        await logActivity(req.user, 'Réalisation modifiée', `Réalisation #${realisation.id} — ${realisation.titre || 'Sans titre'}`, req);
        return res.status(200).json({ 
            message: 'Réalisation mise à jour', 
            realisation: {
                ...realisation.toJSON(),
                images: parseImagesSafe(realisation.images)
            }
        });
    } catch (error) {
        return res.status(400).json({ message: 'Erreur mise à jour', error: error.message });
    }
};

export const deleteRealisation = async (req, res) => {
    try {
        const realisation = await Realisation.findByPk(req.params.id);
        if (!realisation) return res.status(404).json({ message: 'Réalisation introuvable' });
        await logActivity(req.user, 'Réalisation supprimée', `Réalisation #${realisation.id} — ${realisation.titre}`, req);
        await realisation.destroy();
        return res.status(200).json({ message: 'Réalisation supprimée' });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur suppression', error: error.message });
    }
};
