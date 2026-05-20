export const realisationSchema = {
    titre: {
        in: ['body'],
        optional: true,
        isString: { errorMessage: 'Le titre doit être une chaîne de caractères' },
    },
    date: {
        in: ['body'],
        optional: true,
        isString: { errorMessage: 'La date doit être une chaîne de caractères' },
    },
    categorie: {
        in: ['body'],
        optional: true,
        isString: { errorMessage: 'La catégorie doit être une chaîne de caractères' },
        isIn: {
            options: [['Agence', 'Mode', 'RASMA', 'Formation']],
            errorMessage: 'Catégorie invalide. Options: Agence, Mode, RASMA, Formation',
        },
    },
    description: {
        in: ['body'],
        optional: true,
        isString: { errorMessage: 'La description doit être une chaîne de caractères' },
    },
    image: {
        in: ['body'],
        isString: { errorMessage: 'L\'image doit être une chaîne de caractères' },
        optional: true,
    },
};
