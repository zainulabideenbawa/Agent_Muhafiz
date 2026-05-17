import { Router } from 'express';
import { getUrbanOptimization, deployHub, insertMaintenanceTask, saveIncident } from '../db/index.js';
import { setUserDirective, runSovereignLogic } from '../sovereign_logic.js';

const router = Router();

router.post('/report', async (req, res) => {
    try {
        const { signal, metadata } = req.body;
        const incidentId = `MHFZ-${Math.floor(1000 + Math.random() * 9000)}`;
        console.log(`[Sovereign] Citizen Report Received: "${signal}" (ID: ${incidentId})`);
        
        await saveIncident(incidentId, 'UNKNOWN', 'ANALYZING', signal);
        
        // Start autonomous logic in the background
        runSovereignLogic(incidentId, signal);
        
        res.json({ success: true, incidentId });
    } catch (e) {
        console.error('[Sovereign] Error handling report:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

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
