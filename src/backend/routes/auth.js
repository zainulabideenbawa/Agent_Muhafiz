import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { findCommanderByEmail, findCommanderById, findUserByNic, createUser } from '../db/index.js';
import { addToBlacklist } from '../middleware/auth.js';

const router = Router();

// ─── COMMANDER / ADMIN LOGIN ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Lookup commander (includes super-admin SUPER-001) from DB
    const commander = await findCommanderByEmail(email);

    if (!commander) {
        return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }

    // Verify password stored in DB
    if (commander.password !== password) {
        return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }

    // Strip sensitive fields before returning
    const { password: _p, cnic: _c, ...safeUser } = commander;

    const token = jwt.sign(
        { email, role: commander.role },
        process.env.JWT_SECRET || 'devsecret',
        { expiresIn: '7d' }
    );

    return res.json({ success: true, token, user: safeUser });
});

// ─── LOGOUT (token blacklist) ────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(400).json({ success: false, message: 'No token provided' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(400).json({ success: false, message: 'Invalid token format' });
    addToBlacklist(token);
    res.json({ success: true, message: 'Logged out' });
});

// ─── COMMANDER PROFILE BY ID ─────────────────────────────────────────────────
router.get('/commander-profile/:id', async (req, res) => {
    const profile = await findCommanderById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Commander not found' });
    const { password: _p, cnic: _c, ...safeProfile } = profile;
    res.json(safeProfile);
});

// ─── CITIZEN AUTH: Request OTP ───────────────────────────────────────────────
router.post('/citizen/request-otp', async (req, res) => {
    const { nic } = req.body;
    if (!nic) return res.status(400).json({ success: false, message: 'NIC is required' });

    // Hardcoded OTP for demo: 123456
    console.log(`[AUTH] OTP Requested for NIC: ${nic}. Demo OTP: 123456`);
    res.json({ success: true, message: 'OTP sent to registered number' });
});

// ─── CITIZEN AUTH: Verify OTP ────────────────────────────────────────────────
router.post('/citizen/verify-otp', async (req, res) => {
    const { nic, otp } = req.body;

    // Hardcoded OTP for demo: 123456
    if (otp !== '123456') {
        return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    let user = await findUserByNic(nic);
    if (!user) {
        // Auto-create profile for first-time citizens
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
        };
    }

    const { password: _p, ...safeUser } = user;
    const token = jwt.sign(
        { nic: user.nic_number || nic, role: 'CITIZEN' },
        process.env.JWT_SECRET || 'devsecret',
        { expiresIn: '7d' }
    );
    res.json({ success: true, token, user: safeUser });
});

// ─── CITIZEN SIGNUP ───────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
    const { nic, name, sector, password } = req.body;
    if (!nic) return res.status(400).json({ success: false, message: 'NIC is required' });

    try {
        const existingUser = await findUserByNic(nic);
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
        };

        const { password: _p, ...safeUser } = createdUser;
        const token = jwt.sign(
            { nic: createdUser.nic_number || nic, role: 'CITIZEN' },
            process.env.JWT_SECRET || 'devsecret',
            { expiresIn: '7d' }
        );
        res.json({ success: true, token, user: safeUser });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: 'Enrollment failed' });
    }
});

export default router;
