import Joi from 'joi';

export const candidatureSchema = Joi.object({
    nom: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    telephone: Joi.string().min(8).required(),
    poste: Joi.string().min(2).required(),
});
