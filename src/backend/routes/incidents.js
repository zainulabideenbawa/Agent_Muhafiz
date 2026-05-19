import { Router } from 'express';
import { saveIncident, updateIncidentState, getAllIncidents } from '../db/index.js';
import { runSovereignLogic } from '../sovereign_logic.js';
import { broadcast } from '../websocket.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const raw = await getAllIncidents(20);
        const normalized = raw.map(inc => {
            const d = inc.data || {};
            const cls = d.classification || {};
            const actionPlan = d.action_plan || {};
            const impact = d.impact_analysis || {};
            return {
                ...inc,
                // Standardized confidence — pulled from wherever the agent stored it
                confidence: cls.confidence_level ?? d.confidence_level ?? d.confidence ?? null,
                // Resolved type and location from nested classification if top-level is blank
                type: (inc.type && inc.type !== 'UNKNOWN') ? inc.type : (cls.type || 'UNKNOWN'),
                location: (inc.location && inc.location !== 'ANALYZING')
                    ? inc.location
                    : (cls.location?.landmark || d.location || 'ANALYZING'),
                // Surface useful agent outputs to top level for Flutter apps
                instructions: actionPlan.tactical_directive || null,
                equipment: Array.isArray(actionPlan.deployment?.units)
                    ? actionPlan.deployment.units.join(', ')
                    : null,
                analyst_prediction: impact.spread_prediction
                    ? `${impact.spread_prediction} spread · ${impact.affected_population ?? '?'} affected · ${impact.estimated_duration ?? '?'}`
                    : null,
            };
        });
        res.json(normalized);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/trigger-crisis', async (req, res) => {
    const signal = req.body.signal || req.body.input;
    const incidentId = `MHFZ-${Math.floor(1000 + Math.random() * 9000)}`;
    await saveIncident(incidentId, 'UNKNOWN', 'ANALYZING', signal);
    console.log(`[Incident Triggered] ${signal} - Saved to queue.`);
    res.json({ success: true, incidentId });
});

router.post('/retract-alert', async (req, res) => {
    const { incidentId, reason } = req.body;
    // Detect whether this is a False Alarm or Road Clear
    const isFalseAlarm = (reason || '').toLowerCase().includes('false') || (reason || '').toLowerCase().includes('alarm');
    const resolution = isFalseAlarm ? 'FALSE_ALARM' : 'ROAD_CLEAR';
    const resolutionLabel = isFalseAlarm ? '🚫 False Alarm' : '🛣️ Road Clear';

    console.log(`[Auditor Agent] ALERT RETRACTION (${resolution}): ${incidentId} — ${reason}`);
    try {
        await updateIncidentState(incidentId, 'RETRACTED', {
            retraction_reason: reason,
            resolution_type: resolution,
            traceLogs: [{
                agent: 'The Auditor',
                message: `${resolutionLabel}: Field officer verification confirms — ${reason}. All dispatched units recalled. Incident closed.`,
                outcome: resolution,
                timestamp: new Date().toISOString()
            }]
        });

        // TRACE_LOG — updates the AgentTraceTerminal feed
        broadcast({
            type: 'TRACE_LOG',
            incidentId,
            log: {
                agent: 'The Auditor',
                message: `${resolutionLabel}: Field officer confirms ${reason}. Units recalled.`,
                outcome: resolution,
                timestamp: new Date().toISOString()
            }
        });

        // RESOLUTION_ALERT — triggers the user-facing notification banner
        broadcast({
            type: 'RESOLUTION_ALERT',
            incidentId,
            resolution,
            label: resolutionLabel,
            message: `Incident ${incidentId} marked as ${resolutionLabel}. All units recalled and traffic corridor restored.`,
            reason: reason || 'Field officer ground-truth verification',
            timestamp: new Date().toISOString()
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
                message: 'Quest Accepted. Field officer en route to verify signal. Pipeline on standby.',
                outcome: 'EN_ROUTE',
                timestamp: new Date().toISOString()
            }]
        });

        broadcast({
            type: 'TRACE_LOG',
            incidentId,
            log: {
                agent: 'The TruthEngine',
                message: 'Quest Accepted. Officer status: EN ROUTE for ground-truth verification.',
                outcome: 'EN_ROUTE',
                timestamp: new Date().toISOString()
            }
        });

        // Notify dashboard that a field officer is now on the move
        broadcast({
            type: 'RESOLUTION_ALERT',
            incidentId,
            resolution: 'QUEST_ACCEPTED',
            label: '🚔 Officer Dispatched',
            message: `Field officer accepted verification quest for ${incidentId} and is now en route to the scene.`,
            reason: 'HITL Quest accepted by field officer',
            timestamp: new Date().toISOString()
        });

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/confirm-crisis', async (req, res) => {
    const { incidentId, note } = req.body;
    console.log(`[Auditor Agent] CRISIS CONFIRMED: ${incidentId} - ${note}`);
    try {
        await updateIncidentState(incidentId, 'CONFIRMED', {
            officer_verdict: 'CONFIRMED',
            officer_note: note || 'Crisis confirmed by field officer.',
            resolution_type: 'CONFIRMED',
            traceLogs: [{
                agent: 'The Auditor',
                message: `✅ CRISIS CONFIRMED: Field officer on-scene confirms the crisis is active. Full deployment authorised.`,
                outcome: 'CONFIRMED',
                timestamp: new Date().toISOString()
            }]
        });

        broadcast({
            type: 'TRACE_LOG',
            incidentId,
            log: {
                agent: 'The Auditor',
                message: `✅ CRISIS CONFIRMED: On-scene verification complete. Deployment authorised.`,
                outcome: 'CONFIRMED',
                timestamp: new Date().toISOString()
            }
        });

        // Notify all dashboard users that a crisis is now ground-truth confirmed
        broadcast({
            type: 'RESOLUTION_ALERT',
            incidentId,
            resolution: 'CONFIRMED',
            label: '✅ Crisis Confirmed',
            message: `Incident ${incidentId} CONFIRMED by field officer on-scene. ${note || 'Full autonomous deployment authorised.'}`,
            reason: note || 'Field officer ground-truth confirmation',
            timestamp: new Date().toISOString()
        });

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
