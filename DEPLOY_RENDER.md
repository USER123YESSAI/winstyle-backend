# Déploiement sur Render

Ce guide explique comment déployer le backend Win's Agency sur Render.

## Prérequis
- Avoir un dépôt Git (GitHub, GitLab, Bitbucket) avec ce projet pushé.
- Compte Render (https://render.com)

## Fichiers ajoutés / configuration
- `Dockerfile` : image Docker pour exécution en production.
- `.dockerignore` : réduit le contexte de build (évite node_modules, uploads, tests, etc.).
- `.github/workflows/ci.yml` : GitHub Actions CI (installe dépendances + exécute les tests).
- `render.yaml` : configuration Render (IaC).
- `package.json` : script `start` configuré pour la production (`node server.js`).




## Étapes de déploiement
1. Pousser votre branche `main` (ou la branche spécifiée dans `render.yaml`) sur votre remote.

2. Dans Render, créer un nouveau **Web Service**
   - Si tu utilises **render.yaml** (IaC) : Render s’occupe de la config.
   - Sinon (mode manuel) : connecter le repo Git puis définir :
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Branche: `main`


3. Configurer les variables d'environnement dans le dashboard Render (Settings → Environment):
   - `NODE_ENV` = `production`
   - `DB_DIALECT` = `mysql`
   - `DB_HOST` = `<your-db-host>`
   - `DB_USER` = `<your-db-user>`
   - `DB_PASSWORD` = `<your-db-password>`
   - `DB_NAME` = `<your-db-name>`
   - `DB_PORT` = `3306` (si différent, adapter)
   - `SECRET_KEY` = `<your-jwt-secret>`
   - `CLIENT_URL` = `<url de ton front>`

4. Base de données
   - Render propose des bases managées (Postgres/MySQL) via Addons.
   - Crée une instance MySQL chez Render ou utilise un service externe.
   - Remplis les variables d'environnement ci-dessus avec les informations de connexion.

5. Stockage des fichiers `uploads`
   - Le système de fichiers de Render est éphémère. Pour stocker les fichiers persistants (CV, images), utilise un stockage externe (S3, Cloudinary...).
   - Remplacer l'usage direct de `/uploads` par un upload vers S3 ou configurer un disque persistant Render (si nécessaire).

6. Déploiement automatique
   - Après connexion du repo, Render déploie automatiquement les pushes sur la branche configurée.

## Commandes utiles localement
```bash
# Lancer en dev
npm run dev

# Lancer les tests
npm test

# Démarrer en production local (simule Render)
NODE_ENV=production npm start
```


## Remarques
- `render.yaml` peut être utilisé pour provisionner le service via Infrastructure-as-Code. Les secrets ne doivent pas être commités dans ce fichier.
- Si tu veux, je peux créer un `Dockerfile` et une configuration CI (`.github/workflows/ci.yml`) pour tests automatiques avant déploiement.
