import { Router } from 'express';
import { findCommanderByEmail, findCommanderById, findUserByNic, createUser } from '../db/index.js';

const router = Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Check hardcoded SUPER_ADMIN first (has its own password)
    if (email === 'admin@muhafiz.gov' && password === 'sovereign') {
        return res.json({ success: true, user: { role: 'SUPER_ADMIN', name: 'Sovereign Architect', email } });
    }

    // Bug 4 Fix: validate that the user exists AND password matches before granting access
    // Commander mock profiles use 'muhafiz' as default password
    const COMMANDER_DEFAULT_PASSWORD = 'muhafiz';
    const user = await findCommanderByEmail(email);
    if (user && password === COMMANDER_DEFAULT_PASSWORD) {
        return res.json({ success: true, user });
    }

    res.status(401).json({ success: false, message: 'Invalid Credentials' });
});

router.get('/commander-profile/:id', async (req, res) => {
    const profile = await findCommanderById(req.params.id);
    res.json(profile || { commander_id: req.params.id, name: 'Simulated Commander', rank: 'Sovereign-1', department: 'KMC_HEALTH', role: 'DEPT_ADMIN' });
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
        user = (newUsers && newUsers.length > 0) ? newUsers[0] : {
            nic_number: nic,
            name: `Citizen-${nic.slice(-4)}`,
            sector: 'GENERAL',
            password: 'OIDC_VERIFIED'
        };
    }

    res.json({ success: true, user });
});

// MANUAL CITIZEN SIGNUP
router.post('/signup', async (req, res) => {
    const { nic, name, sector, password } = req.body;
    if (!nic) return res.status(400).json({ success: false, message: 'NIC is required' });

    try {
        let existingUser = await findUserByNic(nic);
        if (existingUser && existingUser.nic_number) {
            return res.status(400).json({ success: false, message: 'Citizen already registered' });
        }

        const newUsers = await createUser({
            nic,
            name: name || `Citizen-${nic.slice(-4)}`,
            sector: sector || 'GENERAL',
            password: password || 'OIDC_VERIFIED'
        });

        const createdUser = (newUsers && newUsers.length > 0) ? newUsers[0] : {
            nic_number: nic,
            name: name || `Citizen-${nic.slice(-4)}`,
            sector: sector || 'GENERAL',
            password: password || 'OIDC_VERIFIED'
        };

        res.json({ success: true, user: createdUser });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: 'Enrollment failed' });
    }
});

export default router;
