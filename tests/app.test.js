process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import request from 'supertest';

const { default: app } = await import('../app.js');
const { sequelize, User } = await import('../models/index.js');

const superadminCredentials = {
    nom: 'Super Admin',
    email: 'superadmin@example.com',
    password: 'SuperAdmin123',
};

let authToken;
let formationId;

describe("Win's Agency backend", () => {
    before(async () => {
        await sequelize.sync({ force: true }); // test only (sqlite in-memory)
        const hashedPassword = await bcrypt.hash(superadminCredentials.password, 10);
        await User.create({
            nom: superadminCredentials.nom,
            email: superadminCredentials.email,
            password: hashedPassword,
            role: 'superadmin',
        });
    });

    after(async () => {
        await sequelize.drop();
        await sequelize.close();
    });

    it('GET / returns welcome message', async () => {
        const response = await request(app).get('/');
        assert.strictEqual(response.status, 200);
        assert.deepStrictEqual(response.body, { message: "Win's Agency API - Bienvenue !" });
    });

    it('GET /api/formations returns an array', async () => {
        const response = await request(app).get('/api/formations');
        assert.strictEqual(response.status, 200);
        assert.ok(Array.isArray(response.body));
        assert.strictEqual(response.body.length, 0);
    });

    it('POST /api/auth/login returns token for valid credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: superadminCredentials.email, password: superadminCredentials.password });

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.message, 'Connexion réussie');
        assert.strictEqual(response.body.role, 'superadmin');
        assert.ok(response.body.token);
        authToken = response.body.token;
    });

    it('GET /api/auth/me returns authenticated user data', async () => {
        const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${authToken}`);

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.user.email, superadminCredentials.email);
        assert.strictEqual(response.body.user.role, 'superadmin');
    });

    it('POST /api/formations creates a new formation', async () => {
        const formationPayload = {
            title: 'Test Formation',
            description: 'Une formation créée pendant les tests.',
            date: '2026-06-01',
            lieu: 'Dakar',
            prix: 150000,
            places_disponibles: 30,
        };

        const response = await request(app)
            .post('/api/formations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(formationPayload);

        assert.strictEqual(response.status, 201);
        assert.strictEqual(response.body.message, 'Formation créée');
        assert.strictEqual(response.body.formation.title, formationPayload.title);
        formationId = response.body.formation.id;
    });

    it('GET /api/formations returns the created formation', async () => {
        const response = await request(app).get('/api/formations');
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.length, 1);
        assert.strictEqual(response.body[0].id, formationId);
    });

    it('PUT /api/formations/:id updates the formation', async () => {
        const response = await request(app)
            .put(`/api/formations/${formationId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                title: 'Test Formation Mise à Jour',
                description: 'Description mise à jour.',
                date: '2026-06-02',
                lieu: 'Dakar',
                prix: 160000,
                places_disponibles: 25,
            });

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.message, 'Formation mise à jour');
        assert.strictEqual(response.body.formation.title, 'Test Formation Mise à Jour');
    });

    it('DELETE /api/formations/:id removes the formation', async () => {
        const response = await request(app)
            .delete(`/api/formations/${formationId}`)
            .set('Authorization', `Bearer ${authToken}`);

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.message, 'Formation supprimée');
    });

    it('GET /api/formations returns empty array after deletion', async () => {
        const response = await request(app).get('/api/formations');
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.length, 0);
    });
});
