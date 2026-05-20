import Joi from 'joi';

export const serviceRequestSchema = Joi.object({
    nom: Joi.string().min(2).max(100).required(),
    entreprise: Joi.string().optional().allow(''),
    telephone: Joi.string().min(8).required(),
    service: Joi.string().required(),
    message: Joi.string().optional().allow(''),
    date_evenement: Joi.date().optional().allow(null),
});
