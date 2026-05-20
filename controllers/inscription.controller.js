import { Inscription, Formation } from '../models/index.js';

export const createInscription = async (req, res) => {
    try {
        const formation = await Formation.findByPk(req.body.formationId);
        if (!formation) return res.status(404).json({ message: 'Formation introuvable' });

        const inscription = await Inscription.create(req.body);
        return res.status(201).json({ message: 'Inscription enregistrée', inscription });
    } catch (error) {
        return res.status(400).json({ message: 'Erreur inscription', error: error.message });
    }
};

export const getAllInscriptions = async (req, res) => {
    try {
        const inscriptions = await Inscription.findAll({
            include: [{ model: Formation, attributes: ['title', 'date'] }],
            order: [['createdAt', 'DESC']],
        });
        return res.status(200).json(inscriptions);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

export const getInscriptionById = async (req, res) => {
    try {
        const inscription = await Inscription.findByPk(req.params.id, {
            include: [{ model: Formation, attributes: ['title', 'date'] }],
        });
        if (!inscription) return res.status(404).json({ message: 'Inscription introuvable' });
        return res.status(200).json(inscription);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
