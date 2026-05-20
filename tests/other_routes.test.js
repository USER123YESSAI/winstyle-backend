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
    email: 'superadmin2@example.com',
    password: 'SuperAdmin123',
};

let authToken;

describe('Other routes: contact, candidature, inscription, admin', () => {
    before(async () => {
        await sequelize.sync({ force: true });
        const hashedPassword = await bcrypt.hash(superadminCredentials.password, 10);
        await User.create({
            nom: superadminCredentials.nom,
            email: superadminCredentials.email,
            password: hashedPassword,
            role: 'superadmin',
        });

        // get token
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: superadminCredentials.email, password: superadminCredentials.password });
        authToken = res.body.token;
    });

    after(async () => {
        await sequelize.drop();
        await sequelize.close();
    });

    it('POST /api/contact (public) and GET /api/contact (admin)', async () => {
        const contactPayload = { nom: 'Client', email: 'client@example.com', message: 'Bonjour' };
        const postRes = await request(app).post('/api/contact').send(contactPayload);
        assert.strictEqual(postRes.status, 201);
        assert.strictEqual(postRes.body.message, 'Message envoyé');

        const getRes = await request(app).get('/api/contact').set('Authorization', `Bearer ${authToken}`);
        assert.strictEqual(getRes.status, 200);
        assert.strictEqual(getRes.body.length, 1);
        assert.strictEqual(getRes.body[0].email, contactPayload.email);
    });

    it('POST /api/candidatures (public) and GET /api/candidatures (admin)', async () => {
        const candPayload = { nom: 'Candidat', email: 'cand@example.com', telephone: '770000000', poste: 'Chargé évènements' };
        const postRes = await request(app).post('/api/candidatures').send(candPayload);
        assert.strictEqual(postRes.status, 201);
        assert.strictEqual(postRes.body.message, 'Candidature envoyée');

        const getRes = await request(app).get('/api/candidatures').set('Authorization', `Bearer ${authToken}`);
        assert.strictEqual(getRes.status, 200);
        assert.strictEqual(getRes.body.length, 1);
        assert.strictEqual(getRes.body[0].email, candPayload.email);
    });

    it('POST /api/formations then POST /api/inscriptions and GET /api/inscriptions', async () => {
        const formationPayload = {
            title: 'Formation Test Inscription',
            description: 'Desc',
            date: '2026-07-01',
            lieu: 'Dakar',
            prix: 100000,
            places_disponibles: 20,
        };
        const fRes = await request(app).post('/api/formations').set('Authorization', `Bearer ${authToken}`).send(formationPayload);
        assert.strictEqual(fRes.status, 201);
        const formationId = fRes.body.formation.id;

        const insPayload = { nom: 'Participant', telephone: '770111222', email: 'part@example.com', formationId };
        const postIns = await request(app).post('/api/inscriptions').send(insPayload);
        assert.strictEqual(postIns.status, 201);
        assert.strictEqual(postIns.body.message, 'Inscription enregistrée');

        const getRes = await request(app).get('/api/inscriptions').set('Authorization', `Bearer ${authToken}`);
        assert.strictEqual(getRes.status, 200);
        assert.strictEqual(getRes.body.length, 1);
        assert.strictEqual(getRes.body[0].email, insPayload.email);
    });

    it('POST /api/auth/admins creates an admin (superadmin)', async () => {
        const newAdmin = { nom: 'Admin Test', email: 'admin_test@example.com', password: 'AdminPass123' };
        const res = await request(app).post('/api/auth/admins').set('Authorization', `Bearer ${authToken}`).send(newAdmin);
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.body.admin.email, newAdmin.email);
        assert.strictEqual(res.body.admin.role, 'admin');
    });
});
