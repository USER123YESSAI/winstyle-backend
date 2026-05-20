import Joi from 'joi';

export const inscriptionSchema = Joi.object({
    nom: Joi.string().min(2).max(100).required(),
    telephone: Joi.string().min(8).required(),
    email: Joi.string().email().required(),
    formationId: Joi.number().integer().required(),
});
