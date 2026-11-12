import Joi from 'joi';

export const partenaireSchema = Joi.object({
    nom: Joi.string().min(1).max(150).required().messages({
        'string.empty': 'Le nom du partenaire est obligatoire',
        'any.required': 'Le nom du partenaire est obligatoire',
    }),
    site_web: Joi.string().uri({ scheme: ['http', 'https'] }).max(500).optional().allow('', null).messages({
        'string.uri': "L'URL du site web doit commencer par http:// ou https://",
    }),
    logo: Joi.string().max(500).optional().allow('', null),
    actif: Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0).optional(),
    ordre: Joi.number().integer().min(0).optional(),
});

export const reorderSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            id: Joi.number().integer().required(),
            ordre: Joi.number().integer().min(0).required(),
        })
    ).min(1).required(),
});
