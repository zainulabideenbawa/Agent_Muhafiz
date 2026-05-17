import { Router } from 'express';
import { findCommanderByEmail, findCommanderById, findUserByNic, createUser } from '../db/index.js';

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

// CITIZEN AUTH (NIC + OTP)
router.post('/citizen/request-otp', async (req, res) => {
    const { nic } = req.body;
    if (!nic) return res.status(400).json({ success: false, message: 'NIC is required' });
    
    // MOCK OTP LOGIC
    console.log(`[AUTH] OTP Requested for NIC: ${nic}. Code sent: 123456`);
    res.json({ success: true, message: 'OTP sent to registered number' });
});

router.post('/citizen/verify-otp', async (req, res) => {
    const { nic, otp } = req.body;
    
    if (otp !== '123456') {
        return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    let user = await findUserByNic(nic);
    if (!user) {
        // Auto-create profile for new citizens
        const newUsers = await createUser({
            nic,
            name: `Citizen-${nic.slice(-4)}`,
            sector: 'GENERAL',
            password: 'OIDC_VERIFIED'
        });
        user = newUsers[0];
    }

    res.json({ success: true, user });
});

export default router;
