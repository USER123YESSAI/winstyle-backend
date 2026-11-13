import Joi from 'joi';

export const cmsUpdateSchema = Joi.object({
    title: Joi.string().trim().min(1).max(200).optional().allow('', null),
    actif: Joi.boolean().optional(),
    ordre: Joi.number().integer().min(0).max(9999).optional(),
    publish: Joi.boolean().optional().default(true),
    content: Joi.object().required().messages({
        'object.base': 'Le contenu CMS doit être un objet JSON valide.',
        'any.required': 'Le contenu CMS est obligatoire.',
    }),
});

export const validateCms = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const errors = error.details.map((d) => d.message);
            return res.status(400).json({ message: errors[0], errors });
        }
        req.body = value;
        next();
    };
};
