import Joi from 'joi';

export const contactSchema = Joi.object({
    nom: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    message: Joi.string().min(10).required(),
});
