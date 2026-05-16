import { Router } from 'express';

const router = Router();

router.post('/vitals', (req, res) => {
    const { location } = req.body;
    console.log(`[Tool] Vitals request for: ${location}`);
    res.json({
        location,
        traffic_speed: 12 + Math.floor(Math.random() * 20),
        rainfall: 25 + Math.floor(Math.random() * 30),
        water_level: 15 + Math.floor(Math.random() * 50)
    });
});

router.post('/simulate', (req, res) => {
    const isApproved = Math.random() > 0.2;
    res.json({ approved: isApproved, time_saved_minutes: isApproved ? 45 : 0 });
});

router.get('/resources', async (req, res) => {
    const { getDepartmentResources } = await import('../db/index.js');
    res.json(await getDepartmentResources('KMC_HEALTH'));
});

export default router;
