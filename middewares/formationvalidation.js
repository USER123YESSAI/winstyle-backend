import Joi from 'joi';

export const formationSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).required(),
    date: Joi.date().required(),
    lieu: Joi.string().min(2).required(),
    prix: Joi.number().positive().required(),
    places_disponibles: Joi.number().integer().min(1).required(),
});
