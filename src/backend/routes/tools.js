import { Router } from 'express';

const router = Router();

router.post('/vitals', (req, res) => {
    const { location } = req.body;
    console.log(`[Tool] Vitals request for: ${location}`);
    res.json({
        location,
        traffic_speed: 12 + Math.floor(Math.random() * 20),
        rainfall: 25 + Math.floor(Math.random() * 30),
        water_level: 15 + Math.floor(Math.random() * 50),
        // Bug 1 Fix: These fields are read by Truth Engine's confidence heuristic
        avg_temp: 28 + Math.floor(Math.random() * 15),
        avg_humidity: 55 + Math.floor(Math.random() * 40)
    });
});

router.post('/simulate', (req, res) => {
    const isApproved = Math.random() > 0.2;
    // Bug 2 Fix: congestion_reduction_percent was missing, causing Oracle log to say "undefined%"
    res.json({
        approved: isApproved,
        time_saved_minutes: isApproved ? 45 : 0,
        congestion_reduction_percent: isApproved ? Math.floor(20 + Math.random() * 40) : 0
    });
});

// Bug Fix: was hardcoded to always return KMC_HEALTH regardless of query param
router.get('/resources', async (req, res) => {
    const deptId = req.query.dept || 'KMC_HEALTH';
    const { getDepartmentResources } = await import('../db/index.js');
    res.json(await getDepartmentResources(deptId));
});

export default router;
