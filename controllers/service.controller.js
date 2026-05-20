import { ServiceRequest } from '../models/index.js';

export const createServiceRequest = async (req, res) => {
    try {
        const serviceRequest = await ServiceRequest.create(req.body);
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
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

export const getServiceRequestById = async (req, res) => {
    try {
        const service = await ServiceRequest.findByPk(req.params.id);
        if (!service) return res.status(404).json({ message: 'Demande introuvable' });
        return res.status(200).json(service);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
