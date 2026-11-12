import Joi from 'joi';

export const temoignageSchema = Joi.object({
    nom: Joi.string().min(2).max(150).required().messages({
        'string.empty': 'Le nom du client est obligatoire',
        'string.min': 'Le nom doit contenir au moins 2 caractères',
        'any.required': 'Le nom du client est obligatoire',
    }),
    fonction: Joi.string().max(150).optional().allow('', null),
    entreprise: Joi.string().max(150).optional().allow('', null),
    texte: Joi.string().min(5).max(2000).required().messages({
        'string.empty': 'Le contenu du témoignage est obligatoire',
        'string.min': 'Le témoignage doit contenir au moins 5 caractères',
        'any.required': 'Le contenu du témoignage est obligatoire',
    }),
    photo: Joi.string().max(500).optional().allow('', null),
    note: Joi.number().integer().min(1).max(5).optional(),
    actif: Joi.boolean().truthy('true', '1', 1).falsy('false', '0', 0).optional(),
    ordre: Joi.number().integer().min(0).optional(),
});
