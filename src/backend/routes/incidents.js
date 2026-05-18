import { Router } from 'express';
import { saveIncident, updateIncidentState, getAllIncidents } from '../db/index.js';
import { runSovereignLogic } from '../sovereign_logic.js';
import { broadcast } from '../websocket.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        res.json(await getAllIncidents(20));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/trigger-crisis', async (req, res) => {
    const { input } = req.body;
    const incidentId = `MHFZ-${Math.floor(1000 + Math.random() * 9000)}`;
    await saveIncident(incidentId, 'UNKNOWN', 'ANALYZING', input);
    runSovereignLogic(incidentId, input);
    res.json({ success: true, incidentId });
});

router.post('/retract-alert', async (req, res) => {
    const { incidentId, reason } = req.body;
    console.log(`[Auditor Agent] ALERT RETRACTION: ${incidentId} due to ${reason}`);
    try {
        await updateIncidentState(incidentId, 'RETRACTED', {
            retraction_reason: reason,
            traceLogs: [{
                agent: 'The Auditor',
                message: `ALERT RETRACTED: Human-in-the-loop verification confirms ${reason}.`,
                outcome: 'Success',
                timestamp: new Date().toISOString()
            }]
        });
        broadcast({
            type: 'TRACE_LOG',
            incidentId,
            log: {
                agent: 'The Auditor',
                message: `ALERT RETRACTED: Human-in-the-loop verification confirms ${reason}.`,
                outcome: 'Success'
            }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/accept-quest', async (req, res) => {
    const { incidentId } = req.body;
    console.log(`[Truth-Engine] QUEST ACCEPTED: ${incidentId}`);
    try {
        await updateIncidentState(incidentId, 'INVESTIGATING', {
            officer_status: 'EN_ROUTE',
            traceLogs: [{
                agent: 'The TruthEngine',
                message: 'Quest Accepted. Officer status updated to EN ROUTE.',
                outcome: 'Success',
                timestamp: new Date().toISOString()
            }]
        });
        broadcast({
            type: 'TRACE_LOG',
            incidentId,
            log: {
                agent: 'The TruthEngine',
                message: 'Quest Accepted. Officer status updated to EN ROUTE.',
                outcome: 'Success'
            }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
