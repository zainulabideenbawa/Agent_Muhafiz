import { Router } from 'express';
import { getUrbanOptimization, deployHub, insertMaintenanceTask } from '../db/index.js';
import { setUserDirective } from '../sovereign_logic.js';

const router = Router();

router.post('/agent-directive', (req, res) => {
    const { directive } = req.body;
    setUserDirective(directive);
    console.log(`[Sovereign] Manual Directive Received: ${directive}`);
    res.json({ success: true, directive });
});

router.get('/sovereign-intelligence', (req, res) => {
    res.json(getUrbanOptimization());
});

router.post('/execute/deploy-hub', async (req, res) => {
    const { sector, dept } = req.body;
    await deployHub(dept, sector);
    res.json({ success: true, message: `Station Authorized in ${sector}` });
});

router.post('/execute/dispatch-maintenance', async (req, res) => {
    const { sector } = req.body;
    await insertMaintenanceTask(sector);
    res.json({ success: true, message: 'Maintenance Crew Dispatched' });
});

export default router;
