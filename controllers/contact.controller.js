import { Contact } from '../models/index.js';

export const createContact = async (req, res) => {
    try {
        const { nom, email, message } = req.body;
        const contact = await Contact.create({ nom, email, message });
        return res.status(201).json({ message: 'Message envoyé', contact });
    } catch (error) {
        return res.status(400).json({ message: 'Erreur envoi', error: error.message });
    }
};

export const getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(200).json(contacts);
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};
