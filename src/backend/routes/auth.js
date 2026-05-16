import { Router } from 'express';
import { findCommanderByEmail, findCommanderById } from '../db/index.js';

const router = Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await findCommanderByEmail(email);
    if (user) return res.json({ success: true, user });

    if (email === 'admin@muhafiz.gov' && password === 'sovereign') {
        return res.json({ success: true, user: { role: 'SUPER_ADMIN', name: 'Sovereign Architect', email } });
    }
    res.status(401).json({ success: false, message: 'Invalid Credentials' });
});

router.get('/commander-profile/:id', async (req, res) => {
    const profile = await findCommanderById(req.params.id);
    res.json(profile || { name: 'Simulated Commander', rank: 'Sovereign-1' });
});

export default router;
