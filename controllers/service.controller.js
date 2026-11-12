import { ServiceRequest } from '../models/index.js';

export const createServiceRequest = async (req, res) => {
    try {
        const { nom, entreprise, telephone, service, message, date_evenement } = req.body;
        const serviceRequest = await ServiceRequest.create({
            nom,
            entreprise: entreprise || null,
            telephone,
            service,
            message: message || null,
            date_evenement: date_evenement || null,
        });
        return res.status(201).json({ message: 'Demande de service envoyée', serviceRequest });
    } catch (error) {
        return res.status(400).json({ message: 'Erreur demande', error: error.message });
    }
};

export const getAllServiceRequests = async (req, res) => {
    try {
        const services = await ServiceRequest.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(200).json(services);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const getServiceRequestById = async (req, res) => {
    try {
        const service = await ServiceRequest.findByPk(req.params.id);
        if (!service) return res.status(404).json({ message: 'Demande introuvable' });
        return res.status(200).json(service);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};
