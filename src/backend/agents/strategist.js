import { proModel } from './models.js';
import { safeParseJson } from './parser.js';
import { get_resource_status, get_nearest_infrastructure, get_route_eta } from '../tools.js';

// Karachi emergency hub database — exact addresses
const KARACHI_HUBS = {
    FIRE_BRIGADE: [
        { name: 'KFB Central HQ — Saddar', address: 'Fire Station Road, Saddar, Karachi', lat: 24.8739, lng: 67.0250, trucks: 6, officers: 30 },
        { name: 'KFB North Station — SITE', address: 'SITE Area Fire Station, Karachi', lat: 24.9200, lng: 67.0100, trucks: 4, officers: 20 },
        { name: 'KFB East Station — Landhi', address: 'Landhi Fire Station, Karachi', lat: 24.8500, lng: 67.1400, trucks: 3, officers: 15 },
    ],
    KMC_HEALTH: [
        { name: 'KMC Dewatering Pump Station — NIPA', address: 'KMC Workshop, NIPA Chowrangi, Karachi', lat: 24.9215, lng: 67.0900, trucks: 3, officers: 10 },
        { name: 'KMC Central Workshop — MA Jinnah', address: 'KMC Central Workshop, M.A. Jinnah Road', lat: 24.8607, lng: 67.0300, trucks: 4, officers: 12 },
        { name: 'NDMA Relief Hub — Karachi', address: 'NDMA Regional Office, Shahrah-e-Faisal', lat: 24.8900, lng: 67.0800, trucks: 2, officers: 8 },
    ],
    RESCUE_1122: [
        { name: 'Rescue 1122 Headquarters — Gulshan', address: 'Rescue 1122, Gulshan-e-Iqbal, Karachi', lat: 24.9215, lng: 67.0900, trucks: 5, officers: 25 },
        { name: 'Edhi Foundation Central — Sohrab Goth', address: 'Edhi Foundation, Sohrab Goth, Karachi', lat: 24.9500, lng: 67.0600, trucks: 8, officers: 40 },
    ],
    POLICE_FORCE: [
        { name: 'Karachi Central Police Office (CPO)', address: 'CPO, Garden Road, Karachi', lat: 24.8740, lng: 67.0340, officers: 200 },
        { name: 'Gulshan Police Station', address: 'Gulshan-e-Iqbal Police Station, Karachi', lat: 24.9215, lng: 67.0900, officers: 60 },
        { name: 'Traffic Police Headquarters', address: 'Traffic HQ, Shahrah-e-Faisal, Karachi', lat: 24.8900, lng: 67.0750, officers: 300 },
    ],
};

// Crisis-type specific tactical directives
const TACTICAL_TEMPLATES = {
    fire: (landmark, hub, eta, routePrimary, routeAvoid, policeBlock, nearestHospital) =>
        `FIRE RESPONSE DIRECTIVE — ${landmark}\n` +
        `1. ROUTE: All units depart ${hub} via ${routePrimary}. Avoid ${routeAvoid}.\n` +
        `2. POLICE CLEARANCE: Contact ${policeBlock} immediately. Request 300m exclusion zone around fire perimeter.\n` +
        `3. ON-SCENE: Establish Incident Command Post (ICP) 200m upwind from fire. Deploy Heavy Tanker to primary access. Platform truck for aerial suppression.\n` +
        `4. EVACUATION: Clear all structures within 150m. Coordinate with ${nearestHospital} for casualty intake.\n` +
        `5. UTILITIES: Contact KESC (021-99200) to cut power in the immediate block. Notify SSGC (0800-00786) for gas main isolation.\n` +
        `6. ETA: ${eta} minutes from ${hub}.`,

    flood: (landmark, hub, eta, routePrimary, routeAvoid, policeBlock, nearestHospital) =>
        `FLOOD RESPONSE DIRECTIVE — ${landmark}\n` +
        `1. ROUTE: Suction pump units via ${routePrimary}. DO NOT use ${routeAvoid} (first to submerge).\n` +
        `2. POLICE CLEARANCE: Contact ${policeBlock} to divert civilian traffic IMMEDIATELY. Deploy barriers at underpass entrance.\n` +
        `3. ON-SCENE: Position suction pump at KDA drain overflow point. Start dewatering at the lowest accumulation point first.\n` +
        `4. MEDICAL: Alert ${nearestHospital} on standby — risk of drowning and electric shock from submerged wiring.\n` +
        `5. RESIDENT ALERT: Door-to-door evacuation of ground-floor residents. Coordinate with Edhi Foundation for shelter.\n` +
        `6. ETA: ${eta} minutes from ${hub}.`,

    blast: (landmark, hub, eta, routePrimary, routeAvoid, policeBlock, nearestHospital) =>
        `BLAST/EXPLOSION RESPONSE DIRECTIVE — ${landmark}\n` +
        `1. ROUTE: All emergency units ONLY via ${routePrimary} with Police escort. Block ${routeAvoid}.\n` +
        `2. CORDON: ${policeBlock} — 300m radius hard cordon. CTD must clear secondary IED risk first.\n` +
        `3. ON-SCENE: Bomb Disposal Squad leads entry. No other units enter until BDS clearance confirmed.\n` +
        `4. TRAUMA TRIAGE: Set up field triage at cordon perimeter. Direct critical cases to ${nearestHospital}.\n` +
        `5. MEDIA: CTD spokesperson to manage media at 500m distance. No civilian recordings of scene.\n` +
        `6. ETA: ${eta} minutes. CTD + 1122 simultaneous response.`,

    protest: (landmark, hub, eta, routePrimary, routeAvoid, policeBlock, nearestHospital) =>
        `CIVIL ORDER DIRECTIVE — ${landmark}\n` +
        `1. ALTERNATE ROUTE: Divert all civilian traffic via ${routePrimary}. ${routeAvoid} is CLOSED.\n` +
        `2. POLICE BLOCK: Traffic Police to deploy at ${policeBlock} immediately. No civilian vehicles within 200m.\n` +
        `3. NEGOTIATION: DSP-level officer to establish dialogue with protest leadership. Avoid confrontation.\n` +
        `4. MEDICAL STANDBY: ${nearestHospital} on standby for potential injuries. Edhi ambulance pre-positioned at perimeter.\n` +
        `5. AMBULANCE CORRIDOR: Maintain ONE dedicated emergency vehicle corridor at all times via ${routePrimary}.\n` +
        `6. ETA: ${eta} minutes to scene from ${hub}.`,
};

import { getDepartmentResources, updateDepartmentResources } from '../db/index.js';

// Karachi coordinate lookup for database hubs
const HUB_COORDINATES = {
    'Gulshan': { lat: 24.9215, lng: 67.0900 },
    'Saddar': { lat: 24.8739, lng: 67.0250 },
    'Defence': { lat: 24.8250, lng: 67.0700 },
    'Nazimabad': { lat: 24.9200, lng: 67.0300 },
    'Landhi': { lat: 24.8500, lng: 67.1400 },
    'Clifton': { lat: 24.8200, lng: 67.0300 }
};

const selectHubWithResources = async (dept, incidentLat, incidentLng, crisisType) => {
    // 1. Fetch live hubs from DB
    const hubs = await getDepartmentResources(dept);
    
    // Sort by distance (closest first)
    const hubsWithDist = hubs.map(h => {
        const coords = HUB_COORDINATES[h.location] || { lat: 24.8607, lng: 67.0011 };
        const dist = Math.sqrt(Math.pow(coords.lat - incidentLat, 2) + Math.pow(coords.lng - incidentLng, 2));
        return { ...h, lat: coords.lat, lng: coords.lng, distance: dist };
    });
    
    if (hubsWithDist.length === 0) {
        // Ultimate fallback
        return {
            selectedHub: { id: 'FB-CEN', name: 'Central Fire Station', location: 'Saddar', lat: 24.8739, lng: 67.0250, trucks: 5, ambulances: 2, officers: 20 },
            warning: null,
            allHubs: [],
            requirements: { trucks: 0, ambulances: 0, officers: 0 }
        };
    }

    hubsWithDist.sort((a, b) => a.distance - b.distance);

    // 2. Determine resource requirements based on crisis type
    const type = (crisisType || "").toLowerCase();
    const reqTrucks = (type === 'fire' || type === 'flood') ? 1 : 0;
    const reqAmbulances = (type === 'blast' || type === 'protest' || type === 'flood') ? 1 : 0;
    const reqOfficers = type === 'fire' ? 5 : (type === 'blast' || type === 'protest') ? 5 : 3;

    // 3. Try closest hub first
    const primaryHub = hubsWithDist[0];
    const hasEnough = (primaryHub.trucks >= reqTrucks) && 
                      (primaryHub.ambulances >= reqAmbulances) && 
                      (primaryHub.officers >= reqOfficers);

    if (hasEnough) {
        return {
            selectedHub: primaryHub,
            warning: null,
            allHubs: hubsWithDist,
            requirements: { trucks: reqTrucks, ambulances: reqAmbulances, officers: reqOfficers }
        };
    }

    // Proximity fallback: find first hub that satisfies requirements
    for (let i = 1; i < hubsWithDist.length; i++) {
        const backupHub = hubsWithDist[i];
        const backupHasEnough = (backupHub.trucks >= reqTrucks) && 
                                (backupHub.ambulances >= reqAmbulances) && 
                                (backupHub.officers >= reqOfficers);
        if (backupHasEnough) {
            const warning = `⚠️ RESOURCE DEPLETION ALERT: Nearest station (${primaryHub.name}) has exhausted its fleet. Rerouting dispatch to secondary station (${backupHub.name}) at ${backupHub.location}.`;
            return {
                selectedHub: backupHub,
                warning,
                allHubs: hubsWithDist,
                requirements: { trucks: reqTrucks, ambulances: reqAmbulances, officers: reqOfficers }
            };
        }
    }

    // All hubs exhausted - dispatch closest anyway with critical warning
    const warning = `🚨 CRITICAL DEPLETION: All hubs for ${dept} are at maximum capacity! Dispatching emergency backup units from closest station (${primaryHub.name}) under degraded availability.`;
    return {
        selectedHub: primaryHub,
        warning,
        allHubs: hubsWithDist,
        requirements: {
            trucks: Math.min(primaryHub.trucks, reqTrucks),
            ambulances: Math.min(primaryHub.ambulances, reqAmbulances),
            officers: Math.min(primaryHub.officers, reqOfficers)
        }
    };
};

export const strategist = async (state) => {
    const loc = state.classification?.location;
    const landmark = (loc && typeof loc === 'object' ? loc.landmark : loc) || 'Karachi';
    const lat = loc?.lat || 24.8607;
    const lng = loc?.lng || 67.0011;
    const crisisType = (state.classification?.type || 'flood').toLowerCase();
    const dept = state.assigned_department || 'RESCUE_1122';
    const zoneIntel = state.classification?.zone_intel || {};
    const triage = state.triage || {};

    // Get real nearest infrastructure from OpenStreetMap
    const nearbyInfra = await get_nearest_infrastructure(lat, lng, crisisType);
    const nearestFacility = nearbyInfra.found && nearbyInfra.results[0]
        ? nearbyInfra.results[0].name
        : null;

    // Identify closest hub under live resource constraints
    const { selectedHub, warning, allHubs, requirements } = await selectHubWithResources(dept, lat, lng, crisisType);

    // Get real TomTom ETA from the selected hub to incident coords
    const routeEta = await get_route_eta(selectedHub.lat, selectedHub.lng, lat, lng);
    const etaMins = routeEta.eta_mins;
    const etaLabel = routeEta.source !== 'Simulated'
        ? `${etaMins} min (TomTom live-traffic verified)`
        : `${etaMins} min (estimated)`;

    console.log(`[Strategist] Selected hub: "${selectedHub.name}" → ETA ${etaLabel}`);
    if (warning) console.warn(`[Strategist] ${warning}`);

    // Get route intel from triage
    const routePrimary = triage.route_directive?.primary_route || zoneIntel.key_roads?.[0] || 'Shara-e-Faisal (M-9 Corridor)';
    const routeAvoid = triage.route_directive?.avoid || zoneIntel.key_roads?.[1] || 'Low-lying underpasses';
    const policeBlock = triage.route_directive?.police_block_required_at || zoneIntel.police_station || 'Nearest intersection';
    const nearestHospital = nearestFacility || zoneIntel.nearby_hospitals?.[0] || 'Civil Hospital Karachi';

    // Select crisis-specific units
    const unitsByDept = {
        FIRE_BRIGADE: ['KFB Heavy Water Tanker (30,000L capacity)', 'KFB Aerial Platform Truck (30m reach)', 'Rescue Team Alpha (15 personnel)', 'KFB Hazmat Unit'],
        KMC_HEALTH: ['KMC Heavy Suction Pump (1,000 L/min)', 'Emergency Dewatering Excavator (JCB)', 'NDMA Relief Van (50 persons capacity)', 'KMC Drainage Crew (8 workers)'],
        RESCUE_1122: ['Rescue 1122 Rapid Response Van', 'Advanced Life Support Ambulance (ALS)', 'Edhi Ambulance Unit #3', 'Bomb Disposal Squad (CTD)', 'CCTV Surveillance Van'],
        POLICE_FORCE: ['Traffic Police Mobile Patrol Unit', 'DSP Riot Control Platoon (30 officers)', 'Police Negotiation Cell', 'Karachi Traffic Police Motorcycle Squad'],
    };
    const selectedUnits = unitsByDept[dept] || unitsByDept.RESCUE_1122;

    // Build tactical directive
    const tacticalFn = TACTICAL_TEMPLATES[crisisType] || TACTICAL_TEMPLATES.flood;
    const tacticalDirective = tacticalFn(landmark, selectedHub.name, etaMins, routePrimary, routeAvoid, policeBlock, nearestHospital);

    const heuristicPlan = {
        priority_level: (state.classification?.urgency || 0) >= 8 ? 'CRITICAL' : 'HIGH',
        deployment: {
            hub: selectedHub.name,
            hub_address: selectedHub.location,
            units: selectedUnits,
            eta_mins: etaMins,
            eta_label: etaLabel,
            distance_km: routeEta.distance_km,
            traffic_delay_mins: routeEta.delay_mins,
            route_source: routeEta.source,
            resources_allocated: {
                hubId: selectedHub.id,
                dept: dept,
                trucks: requirements.trucks,
                ambulances: requirements.ambulances,
                officers: requirements.officers
            }
        },
        tactical_directive: tacticalDirective,
        inter_agency_coordination: triage.police_notification || `Notify ${policeBlock} for route clearance. Coordinate with ${nearestHospital} for casualty intake.`,
        nearest_facility: nearestFacility ? `${nearestFacility} (OpenStreetMap verified)` : nearestHospital,
        reasoning: (warning ? `[RESOURCE TRADE-OFF] ${warning} ` : '') +
            `Deployed from "${selectedHub.name}" (${selectedHub.location}) — closest available ${dept.replace(/_/g, ' ')} hub to ${landmark}. ` +
            `Real-time TomTom routing via ${routePrimary}: ETA ${etaLabel}. ` +
            `Traffic diversion: avoid ${routeAvoid}. Police block required at: ${policeBlock}. ` +
            `Nearest ${nearbyInfra.amenity || 'hospital'}: ${nearestHospital}.`
    };

    const prompt = `You are the Sovereign Strategist for Karachi ${dept}.
    LOCATION: ${landmark}
    CRISIS TYPE: ${crisisType.toUpperCase()}
    SELECTED HUB: ${JSON.stringify(selectedHub)}
    TRIAGE ROUTE INTEL: ${JSON.stringify(triage.route_directive || {})}
    ZONE INTEL: ${JSON.stringify(zoneIntel)}
    REAL ETA (TomTom): ${etaLabel}
    NEAREST FACILITY (OpenStreetMap): ${nearestFacility || 'not found'}
    WARNING: ${warning || 'none'}
    
    TASK — Be specific, use real addresses:
    1. Confirm the exact hub, list named units with capacities.
    2. Specify turn-by-turn route from hub to scene using real Karachi road names.
    3. State police clearance required at which exact intersection.
    4. Write a tactical directive for field officers (numbered steps).
    5. State inter-agency coordination needed. Include resource warnings if applicable.
    
    Respond ONLY in valid JSON: {
        "priority_level": string, "deployment": { "hub": string, "hub_address": string, "units": [string], "eta_mins": number, "eta_label": string },
        "tactical_directive": string, "inter_agency_coordination": string, "nearest_facility": string, "reasoning": string
    }`;

    let result;
    try {
        const response = await proModel.invoke([['user', prompt]]);
        result = safeParseJson(response.content, heuristicPlan);
    } catch (e) {
        console.warn('[Strategist] LLM unavailable — using operational hub + route heuristics.');
        result = heuristicPlan;
    }

    // Merge resources_allocated into final result
    if (!result.deployment) result.deployment = {};
    result.deployment.resources_allocated = heuristicPlan.deployment.resources_allocated;

    const unitsDispatched = Array.isArray(result.deployment?.units)
        ? result.deployment.units.join(', ')
        : 'Emergency Units';

    console.log(`[Agent: The Strategist] Hub: "${result.deployment?.hub}" — ETA: ${result.deployment?.eta_mins} min — Units: ${unitsDispatched}`);

    // Deduct live resources in DB
    if (allHubs.length > 0) {
        const updatedHubs = allHubs.map(h => {
            if (h.id === selectedHub.id) {
                return {
                    ...h,
                    trucks: Math.max(0, h.trucks - requirements.trucks),
                    ambulances: Math.max(0, h.ambulances - requirements.ambulances),
                    officers: Math.max(0, h.officers - requirements.officers)
                };
            }
            return h;
        });
        await updateDepartmentResources(dept, updatedHubs);
        console.log(`[Strategist] Deducted resources from ${selectedHub.name}: Trucks -${requirements.trucks}, Ambulances -${requirements.ambulances}, Officers -${requirements.officers}`);
    }

    const log = {
        timestamp: new Date().toISOString(),
        agent: 'The Strategist',
        message: (warning ? `⚠️ ${warning}\n` : '') + `🗺️ TACTICAL PLAN LOCKED — ${unitsDispatched} dispatched from ${result.deployment?.hub}. ETA: ${result.deployment?.eta_label || result.deployment?.eta_mins + ' min'}.`,
        outcome: 'Plan Locked',
        details: result,
    };

    return {
        action_plan: result,
        deployment: result.deployment,
        traceLogs: [log],
    };
};
