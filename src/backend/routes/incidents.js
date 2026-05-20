import { Router } from 'express';
import { saveIncident, updateIncidentState, getAllIncidents, getIncidentById, getDepartmentResources, updateDepartmentResources } from '../db/index.js';
import { runSovereignLogic } from '../sovereign_logic.js';
import { broadcast } from '../websocket.js';

const router = Router();

// Quick pre-classifier — mirrors Sentinel heuristics so the incident record
// gets a meaningful type/location from the very first DB write.
const QUICK_CRISIS_KW = {
    fire:    ['fire', 'aag', 'aag lagi', 'aag lag', 'jal', 'jal raha', 'jal gaya', 'blaze', 'smoke', 'dhuan', 'dhuwan', 'flames'],
    flood:   ['flood', 'doob', 'pani', 'barish', 'baarish', 'waterlog', 'water logging', 'submerged', 'paani', 'doob gaya'],
    blast:   ['blast', 'dhamaka', 'explosion', 'bomb', 'attack', 'boom'],
    protest: ['protest', 'dharna', 'strike', 'rally', 'road blocked', 'jam', 'jams', 'traffic jam', 'band', 'shutdown', 'block'],
};
const QUICK_ZONES = [
    { key: 'nipa',           label: 'NIPA Chowrangi, Gulshan-e-Iqbal, Karachi' },
    { key: 'gulshan',        label: 'Gulshan-e-Iqbal, Karachi' },
    { key: 'saddar',         label: 'Saddar, Karachi' },
    { key: 'burn road',      label: 'Burns Road, Saddar, Karachi' },
    { key: 'burns road',     label: 'Burns Road, Saddar, Karachi' },
    { key: 'clifton',        label: 'Clifton, Karachi' },
    { key: 'boatbasin',      label: 'Boat Basin, Clifton, Karachi' },
    { key: 'boat basin',     label: 'Boat Basin, Clifton, Karachi' },
    { key: 'baotbasin',      label: 'Boat Basin, Clifton, Karachi' },
    { key: 'defence',        label: 'DHA Defence, Karachi' },
    { key: 'dha',            label: 'DHA Defence, Karachi' },
    { key: 'liaquatabad',    label: 'Liaquatabad, Karachi' },
    { key: 'nazimabad',      label: 'Nazimabad, Karachi' },
    { key: 'karsaz',         label: 'Karsaz, Karachi' },
    { key: 'korangi',        label: 'Korangi, Karachi' },
    { key: 'landhi',         label: 'Landhi, Karachi' },
    { key: 'orangi',         label: 'Orangi Town, Karachi' },
    { key: 'johar',          label: 'Johar, Karachi' },
    { key: 'malir',          label: 'Malir, Karachi' },
    { key: 'fb area',        label: 'F.B. Area, Karachi' },
    { key: 'federal b',      label: 'F.B. Area, Karachi' },
    { key: 'university road',label: 'University Road, Karachi' },
    { key: 'university rap', label: 'University Road, Karachi' },
    { key: 'uni road',       label: 'University Road, Karachi' },
    { key: 'ma jinnah',      label: 'M.A. Jinnah Road, Karachi' },
    { key: 'jinnah road',    label: 'M.A. Jinnah Road, Karachi' },
    { key: 'site area',      label: 'S.I.T.E. Industrial Area, Karachi' },
    { key: 'lyari',          label: 'Lyari, Karachi' },
    { key: 'baldia',         label: 'Baldia Town, Karachi' },
    { key: 'surjani',        label: 'Surjani Town, Karachi' },
    { key: 'north karachi',  label: 'North Karachi, Karachi' },
    { key: 'north nazimabad',label: 'North Nazimabad, Karachi' },
];
const quickClassify = (text) => {
    const lower = (text || '').toLowerCase();
    let crisisType = 'UNKNOWN';
    for (const [type, kws] of Object.entries(QUICK_CRISIS_KW)) {
        if (kws.some(kw => lower.includes(kw))) { crisisType = type.toUpperCase(); break; }
    }
    let location = 'Karachi';
    for (const zone of QUICK_ZONES) {
        if (lower.includes(zone.key)) { location = zone.label; break; }
    }
    return { crisisType, location };
};

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
    // Pre-classify from signal text so the record immediately shows correct type + location
    const { crisisType, location } = quickClassify(signal);
    await saveIncident(incidentId, crisisType, location, signal);
    console.log(`[Incident Triggered] type=${crisisType}, location="${location}", signal="${signal}" — saved as ${incidentId}`);
    // Run agent pipeline asynchronously
    runSovereignLogic(incidentId, signal).catch(err => console.error('[Pipeline Error]', err));
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
        // Reclaim allocated resources if any
        const incident = await getIncidentById(incidentId);
        const incidentData = incident?.data || {};
        const allocated = incidentData.deployment?.resources_allocated;
        
        let reclaimLog = '';
        if (allocated) {
            const { hubId, dept, trucks, ambulances, officers } = allocated;
            const hubs = await getDepartmentResources(dept);
            const updatedHubs = hubs.map(h => {
                if (h.id === hubId) {
                    return {
                        ...h,
                        trucks: h.trucks + (trucks || 0),
                        ambulances: h.ambulances + (ambulances || 0),
                        officers: h.officers + (officers || 0)
                    };
                }
                return h;
            });
            await updateDepartmentResources(dept, updatedHubs);
            reclaimLog = ` Reclaimed resources: Trucks +${trucks || 0}, Ambulances +${ambulances || 0}, Officers +${officers || 0} returned to ${hubId}.`;
            console.log(`[Auditor: Resource Reclaim] ${reclaimLog}`);
        }

        await updateIncidentState(incidentId, 'RETRACTED', {
            retraction_reason: reason,
            resolution_type: resolution,
            traceLogs: [{
                agent: 'The Auditor',
                message: `${resolutionLabel}: Field officer verification confirms — ${reason}. All dispatched units recalled. Incident closed.${reclaimLog}`,
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
                message: `${resolutionLabel}: Field officer confirms ${reason}. Units recalled.${reclaimLog}`,
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
            message: `Incident ${incidentId} marked as ${resolutionLabel}. All units recalled, resources returned, and traffic corridor restored.`,
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
        const existingIncident = await getIncidentById(incidentId);
        const signalText = existingIncident?.description || existingIncident?.data?.raw_input || "NIPA doob gaya";

        await updateIncidentState(incidentId, 'CONFIRMED', {
            officer_status: 'CONFIRMED',
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

        // Run agent pipeline asynchronously to complete the dispatch, simulation, and auditing
        runSovereignLogic(incidentId, signalText).catch(err => console.error('[Pipeline Error]', err));

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
