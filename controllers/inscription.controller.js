import { sequelize, Inscription, Formation } from '../models/index.js';

export const createInscription = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { nom, email, telephone, formationId } = req.body;
        const formation = await Formation.findByPk(formationId, { transaction: t });
        if (!formation) {
            await t.rollback();
            return res.status(404).json({ message: 'Formation introuvable' });
        }
        if (formation.places_disponibles <= 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Cette formation ne dispose plus de places disponibles' });
        }

        const existing = await Inscription.findOne({
            where: { email, formationId },
            transaction: t,
        });
        if (existing) {
            await t.rollback();
            return res.status(409).json({ message: 'Vous êtes déjà inscrit à cette formation' });
        }

        const inscription = await Inscription.create({ nom, email, telephone, formationId }, { transaction: t });
        await formation.decrement('places_disponibles', { by: 1, transaction: t });
        await t.commit();

        return res.status(201).json({ message: 'Inscription enregistrée', inscription });
    } catch (error) {
        await t.rollback();
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
        return res.status(500).json({ message: 'Erreur serveur' });
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
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};
