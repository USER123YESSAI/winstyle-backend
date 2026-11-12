import { Realisation } from '../models/index.js';
import { logActivity } from '../middewares/logger.js';
import { deleteUploadedFile } from '../middewares/upload.js';

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
        const realisations = await Realisation.findAll({ order: [['createdAt', 'DESC'], ['id', 'DESC']] });
        const parsed = realisations.map(r => ({
            ...r.toJSON(),
            images: parseImagesSafe(r.images)
        }));
        return res.status(200).json(parsed);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur' });
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
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const createRealisation = async (req, res) => {
    try {
        const { titre, date, categorie, description, image } = req.body;
        const data = { titre, date, categorie: categorie || null, description };
        
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            data.images = JSON.stringify(req.files.map(file => file.filename));
        } else if (image) {
            data.images = JSON.stringify([image]);
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
        
        const { titre, date, categorie, description } = req.body;
        const data = {
            ...(titre !== undefined && { titre }),
            ...(date !== undefined && { date }),
            ...(categorie !== undefined && { categorie: categorie || null }),
            ...(description !== undefined && { description }),
        };
        
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
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
        const imagesToDelete = parseImagesSafe(realisation.images);
        await logActivity(req.user, 'Réalisation supprimée', `Réalisation #${realisation.id} — ${realisation.titre}`, req);
        await realisation.destroy();
        for (const img of imagesToDelete) {
            if (!img.startsWith('/images/')) {
                await deleteUploadedFile(img);
            }
        }
        return res.status(200).json({ message: 'Réalisation supprimée' });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur suppression' });
    }
};
