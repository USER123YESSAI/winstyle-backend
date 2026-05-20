import Joi from 'joi';

// ── Login ──────────────────────────────────────────────────────────
export const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': "L'email doit être une adresse valide",
        'any.required': "L'email est obligatoire",
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
        'any.required': 'Le mot de passe est obligatoire',
    }),
});

export const validateLogin = (req, res, next) => {
    const { error } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ errors: error.details.map(d => d.message) });
    }
    next();
};

// ── Création admin ─────────────────────────────────────────────────
export const createAdminSchema = Joi.object({
    nom: Joi.string().min(2).max(100).required().messages({
        'string.empty': 'Le nom est obligatoire',
        'any.required': 'Le nom est obligatoire',
    }),
    email: Joi.string().email().required().messages({
        'string.email': "L'email doit être une adresse valide",
        'any.required': "L'email est obligatoire",
    }),
    password: Joi.string().min(8).required().messages({
        'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
        'any.required': 'Le mot de passe est obligatoire',
    }),
});

export const validateCreateAdmin = (req, res, next) => {
    const { error } = createAdminSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({ errors: error.details.map(d => d.message) });
    }
    next();
};
