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
        const contactPayload = { nom: 'Client', email: 'client@example.com', message: 'Bonjour, je souhaite obtenir un devis.' };
        const postRes = await request(app).post('/api/contact').send(contactPayload);
        assert.strictEqual(postRes.status, 201);
        assert.strictEqual(postRes.body.message, 'Message envoyé');

        const getRes = await request(app).get('/api/contact').set('Authorization', `Bearer ${authToken}`);
        assert.strictEqual(getRes.status, 200);
        assert.strictEqual(getRes.body.length, 1);
        assert.strictEqual(getRes.body[0].email, contactPayload.email);
    });

    it('POST /api/candidatures (public) and GET /api/candidatures (admin)', async () => {
        const candPayload = { nom: 'Candidat', email: 'cand@example.com', telephone: '65096024', poste: 'Chargé évènements' };
        const postRes = await request(app).post('/api/candidatures').send(candPayload);
        assert.strictEqual(postRes.status, 201);
        assert.strictEqual(postRes.body.message, 'Candidature envoyée');

        const getRes = await request(app).get('/api/candidatures').set('Authorization', `Bearer ${authToken}`);
        assert.strictEqual(getRes.status, 200);
        assert.strictEqual(getRes.body.length, 1);
        assert.strictEqual(getRes.body[0].email, candPayload.email);
    });

    it('POST /api/formations then POST /api/inscriptions decrements places_disponibles and blocks duplicates', async () => {
        const formationPayload = {
            title: 'Formation Test Inscription',
            description: 'Description complète de la formation test.',
            date: '2026-07-01',
            lieu: 'N\'Djaména',
            prix: 100000,
            places_disponibles: 2,
        };
        const fRes = await request(app).post('/api/formations').set('Authorization', `Bearer ${authToken}`).send(formationPayload);
        assert.strictEqual(fRes.status, 201);
        const formationId = fRes.body.formation.id;

        const insPayload = { nom: 'Participant', telephone: '65011122', email: 'part@example.com', formationId };
        const postIns = await request(app).post('/api/inscriptions').send(insPayload);
        assert.strictEqual(postIns.status, 201);
        assert.strictEqual(postIns.body.message, 'Inscription enregistrée');

        // Verify duplicate is blocked (409)
        const dupIns = await request(app).post('/api/inscriptions').send(insPayload);
        assert.strictEqual(dupIns.status, 409);

        // Verify places_disponibles was decremented from 2 to 1
        const updatedFormation = await request(app).get(`/api/formations/${formationId}`);
        assert.strictEqual(updatedFormation.body.places_disponibles, 1);

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

    it('CRUD, toggle, and reorder /api/partenaires', async () => {
        const p1 = await request(app)
            .post('/api/partenaires')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ nom: 'Partenaire A', site_web: 'https://example.com', actif: true, ordre: 1 });
        assert.strictEqual(p1.status, 201);
        const id1 = p1.body.partenaire.id;

        const p2 = await request(app)
            .post('/api/partenaires')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ nom: 'Partenaire B', actif: true, ordre: 2 });
        assert.strictEqual(p2.status, 201);
        const id2 = p2.body.partenaire.id;

        // Reorder: B first (1), A second (2)
        const reorderRes = await request(app)
            .patch('/api/partenaires/reorder')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ items: [{ id: id2, ordre: 1 }, { id: id1, ordre: 2 }] });
        assert.strictEqual(reorderRes.status, 200);
        assert.strictEqual(reorderRes.body.partenaires[0].id, id2);

        // Toggle A to inactive
        const toggleRes = await request(app)
            .patch(`/api/partenaires/${id1}/toggle`)
            .set('Authorization', `Bearer ${authToken}`);
        assert.strictEqual(toggleRes.status, 200);
        assert.strictEqual(toggleRes.body.partenaire.actif, false);

        // Public GET returns only active (Partenaire B)
        const pubRes = await request(app).get('/api/partenaires');
        assert.strictEqual(pubRes.status, 200);
        assert.strictEqual(pubRes.body.length, 1);
        assert.strictEqual(pubRes.body[0].id, id2);

        // Admin GET returns all (2)
        const admRes = await request(app).get('/api/partenaires/admin').set('Authorization', `Bearer ${authToken}`);
        assert.strictEqual(admRes.status, 200);
        assert.strictEqual(admRes.body.length, 2);

        // Delete A
        const delRes = await request(app).delete(`/api/partenaires/${id1}`).set('Authorization', `Bearer ${authToken}`);
        assert.strictEqual(delRes.status, 200);
    });

    it('CRUD, toggle, and reorder /api/temoignages', async () => {
        const t1 = await request(app)
            .post('/api/temoignages')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                nom: 'Marie Client',
                fonction: 'Directrice',
                entreprise: 'Société X',
                texte: 'Service vraiment irréprochable et très professionnel.',
                note: 5,
                actif: true,
                ordre: 1,
            });
        assert.strictEqual(t1.status, 201);
        const id1 = t1.body.temoignage.id;

        // Toggle to inactive
        const toggleRes = await request(app)
            .patch(`/api/temoignages/${id1}/toggle`)
            .set('Authorization', `Bearer ${authToken}`);
        assert.strictEqual(toggleRes.status, 200);
        assert.strictEqual(toggleRes.body.temoignage.actif, false);

        // Public GET returns 0 active
        const pubRes = await request(app).get('/api/temoignages');
        assert.strictEqual(pubRes.status, 200);
        assert.strictEqual(pubRes.body.length, 0);

        // Admin GET returns 1
        const admRes = await request(app).get('/api/temoignages/admin').set('Authorization', `Bearer ${authToken}`);
        assert.strictEqual(admRes.status, 200);
        assert.strictEqual(admRes.body.length, 1);
    });

    it('CMS endpoints (/api/cms/public, /api/cms/admin, draft preview, publish, toggle)', async () => {
        const pubRes = await request(app).get('/api/cms/public');
        assert.strictEqual(pubRes.status, 200);
        assert.ok(pubRes.body.data.home_page);
        assert.ok(pubRes.body.data.navigation);

        // Save draft on faq section
        const draftRes = await request(app)
            .put('/api/cms/faq')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                publish: false,
                content: {
                    subtitle: 'FAQ Brouillon',
                    title: 'Titre Brouillon',
                    items: [],
                },
            });
        assert.strictEqual(draftRes.status, 200);
        assert.strictEqual(draftRes.body.data.statut, 'brouillon');

        // Public without preview still sees published title
        const pubNormal = await request(app).get('/api/cms/public');
        assert.notStrictEqual(pubNormal.body.data.faq.content.title, 'Titre Brouillon');

        // Public with preview=1 + token sees draft title
        const pubPreview = await request(app)
            .get('/api/cms/public?preview=1')
            .set('Authorization', `Bearer ${authToken}`);
        assert.strictEqual(pubPreview.body.preview, true);
        assert.strictEqual(pubPreview.body.data.faq.content.title, 'Titre Brouillon');

        // Publish draft
        const publishRes = await request(app)
            .post('/api/cms/faq/publish')
            .set('Authorization', `Bearer ${authToken}`);
        assert.strictEqual(publishRes.status, 200);
        assert.strictEqual(publishRes.body.data.statut, 'publie');
    });
});
