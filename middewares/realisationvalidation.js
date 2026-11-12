import Joi from 'joi';

export const realisationSchema = Joi.object({
    titre: Joi.string().max(255).optional().allow('', null),
    date: Joi.string().max(100).optional().allow('', null),
    categorie: Joi.string().valid('Agence', 'Mode', 'RASMA', 'Formation').optional().allow('', null),
    description: Joi.string().max(5000).optional().allow('', null),
    image: Joi.string().max(500).optional().allow('', null),
    images: Joi.any().optional(),
});
