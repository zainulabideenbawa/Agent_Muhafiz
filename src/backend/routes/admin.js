import { Router } from 'express';
import { getAllOfficers, getAllCitizens, createOfficer } from '../db/index.js';

const router = Router();

// ─── CNIC MASKING (backend only) ─────────────────────────────────────────────
// Input:  "42101-1234567-1"
// Output: "42101-*******-1"
const maskCnic = (cnic) => {
    if (!cnic || typeof cnic !== 'string') return null;
    const parts = cnic.split('-');
    if (parts.length === 3) {
        return `${parts[0]}-${'*'.repeat(parts[1].length)}-${parts[2]}`;
    }
    // Generic mask: show first 5 and last 1 char
    if (cnic.length > 6) {
        return cnic.slice(0, 5) + '*'.repeat(cnic.length - 6) + cnic.slice(-1);
    }
    return '***';
};

// ─── GET /api/admin/officers ──────────────────────────────────────────────────
router.get('/officers', async (req, res) => {
    try {
        const officers = await getAllOfficers();
        const safe = officers.map(({ password, cnic, ...rest }) => ({
            ...rest,
            cnic: maskCnic(cnic),
        }));
        res.json({ success: true, data: safe });
    } catch (e) {
        console.error('GET /admin/officers error:', e);
        res.status(500).json({ success: false, message: 'Failed to fetch officers' });
    }
});

// ─── POST /api/admin/officers ─────────────────────────────────────────────────
router.post('/officers', async (req, res) => {
    const { name, email, password, cnic, rank, department } = req.body;

    if (!name || !email || !password || !department) {
        return res.status(400).json({
            success: false,
            message: 'name, email, password, and department are required'
        });
    }

    try {
        const officer = await createOfficer({ name, email, password, cnic, rank: rank || 'Field Officer', department });
        const { password: _p, cnic: _c, ...safe } = officer;
        res.status(201).json({ success: true, data: { ...safe, cnic: maskCnic(cnic) } });
    } catch (e) {
        console.error('POST /admin/officers error:', e);
        const msg = e.message?.includes('unique') ? 'Email already exists' : 'Failed to create officer';
        res.status(400).json({ success: false, message: msg });
    }
});

// ─── GET /api/admin/citizens ──────────────────────────────────────────────────
router.get('/citizens', async (req, res) => {
    try {
        const citizens = await getAllCitizens();
        const safe = citizens.map(({ password, nic_number, ...rest }) => ({
            ...rest,
            nic_number: maskCnic(nic_number),
        }));
        res.json({ success: true, data: safe });
    } catch (e) {
        console.error('GET /admin/citizens error:', e);
        res.status(500).json({ success: false, message: 'Failed to fetch citizens' });
    }
});

export default router;
