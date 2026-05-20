import { flashModel } from './models.js';
import { safeParseJson } from './parser.js';

// Karachi department routing intelligence
const DEPT_ROUTING = {
    fire: {
        department: 'FIRE_BRIGADE',
        category: 'LIFE_SAFETY',
        threat_base: 9,
        call_number: '16',
        units: ['Karachi Fire Brigade Heavy Tanker', 'Rescue Platform Truck', 'First Response Team Alpha'],
        routes: {
            saddar: { primary: 'M.A. Jinnah Road → Bunder Road', avoid: 'Empress Market underpass (narrow)', police_block: 'Saddar Chowk intersection' },
            nipa: { primary: 'University Road (outbound) → Abul Hasan Ispahani Road', avoid: 'NIPA U-turn (blocked to heavy vehicles)', police_block: 'NIPA Chowrangi signal' },
            gulshan: { primary: 'Rashid Minhas Road → Gulshan-e-Iqbal Main Boulevard', avoid: 'Gulshan Mor (peak hour congestion)', police_block: 'Gulshan Chowrangi' },
            clifton: { primary: 'Clifton Bridge → Khayaban-e-Iqbal', avoid: 'Boat Basin roundabout (narrow egress)', police_block: 'Do Talwar signal' },
            defence: { primary: 'Korangi Road → Khayaban-e-Shahbaz → DHA entry gate', avoid: 'Khayaban-e-Hafiz peak congestion', police_block: 'DHA Phase 4 Main Gate' },
            liaquatabad: { primary: 'Liaquatabad Flyover → 10-Number Chowrangi', avoid: 'F.B. Area road (prone to flooding)', police_block: '10-Number Chowrangi signal' },
            karsaz: { primary: 'Shara-e-Faisal → Karsaz Underpass', avoid: 'Karsaz underpass if flooded', police_block: 'Karsaz Chowrangi' },
            korangi: { primary: 'National Highway → Korangi Causeway', avoid: 'Landhi bridge during peak hours', police_block: 'Korangi Crossing' },
            default: { primary: 'Shara-e-Faisal (M-9 Corridor)', avoid: 'Kamari Flyover (construction delays)', police_block: 'Nearest chowrangi' }
        }
    },
    flood: {
        department: 'KMC_HEALTH',
        category: 'INFRASTRUCTURE',
        threat_base: 8,
        call_number: '021-99251301',
        units: ['KMC Heavy Suction Pump Unit', 'Emergency Dewatering Excavator', 'NDMA Relief Van'],
        routes: {
            nipa: { primary: 'University Road service lane (avoid main carriageway)', avoid: 'NIPA Chowrangi underpass (first to flood)', police_block: 'University Road signal at NIPA' },
            gulshan: { primary: 'Rashid Minhas Road → Block 7 main entry', avoid: 'Block 13 road (low-lying, first to submerge)', police_block: 'Main Gulshan Chowrangi' },
            saddar: { primary: 'M.A. Jinnah Road → Bunder Road slip road', avoid: 'Regal Chowk underpass (severe waterlogging point)', police_block: 'Regal Chowk' },
            karsaz: { primary: 'Shara-e-Faisal → Karsaz slip road (use service lane)', avoid: 'Karsaz underpass (floods within 30 min of heavy rain)', police_block: 'Karsaz signal' },
            default: { primary: 'Nearest major road service lane', avoid: 'Low-lying underpasses and underbridges', police_block: 'Nearest flood-prone chowrangi' }
        }
    },
    blast: {
        department: 'RESCUE_1122',
        category: 'LIFE_SAFETY',
        threat_base: 10,
        call_number: '1122',
        units: ['Rescue 1122 Rapid Response Unit', 'Edhi Ambulance Fleet', 'Bomb Disposal Squad', 'CTD Cordoning Team'],
        routes: {
            saddar: { primary: 'M.A. Jinnah Road → cleared lane only (police escort required)', avoid: 'Entire Empress Market radius (500m exclusion)', police_block: 'Saddar Chowk + Regal Chowk full closure' },
            clifton: { primary: 'Clifton Bridge (one-way outbound forced)', avoid: 'Sea View Road (public evacuation route)', police_block: 'Do Talwar + Boat Basin full cordon' },
            default: { primary: 'Emergency corridor via nearest major road', avoid: 'Any market or commercial area within 300m', police_block: '300m radius full cordon required' }
        }
    },
    protest: {
        department: 'POLICE_FORCE',
        category: 'CIVIL_ORDER',
        threat_base: 6,
        call_number: '15',
        units: ['Traffic Police Mobile Unit', 'Riot Control Platoon', 'Negotiation Cell'],
        routes: {
            university_road: { primary: 'Rashid Minhas Road (alternate bypass for traffic)', avoid: 'University Road main carriageway (blocked)', police_block: 'Both ends of University Road + NIPA U-turn' },
            saddar: { primary: 'Bunder Road or Shahrah-e-Pakistan alternate', avoid: 'Entire Saddar commercial strip', police_block: 'Regal + Burns Road perimeter' },
            nazimabad: { primary: 'Manghopir Road bypass', avoid: 'Hassan Square (protest epicentre)', police_block: 'Hassan Square + Five Star Chowrangi' },
            default: { primary: 'Parallel street bypass route', avoid: 'Main road of protest (complete closure)', police_block: 'Both terminal intersections of blocked road' }
        }
    },
    proactive_maintenance: {
        department: 'KWSC_FWO',
        category: 'PREVENTATIVE_MAINTENANCE',
        threat_base: 5,
        call_number: '021-99231218',
        units: ['KWSC Gulshan Suction Truck (KWSC-GUL-T1)', 'FWO Central Sludge Clearance Unit (FWO-CEN-T1)'],
        routes: {
            university_road: { primary: 'University Road BRT Corridor (use specialized construction slip lanes)', avoid: 'BRT main construction channel during peak transit hours', police_block: 'NIPA Chowrangi to Hassan Square transit intersection' },
            default: { primary: 'University Road BRT Corridor (use specialized construction slip lanes)', avoid: 'BRT main construction channel during peak transit hours', police_block: 'NIPA Chowrangi to Hassan Square transit intersection' }
        }
    }
};

const getRouteIntel = (dept, landmark) => {
    const lmLower = (landmark || '').toLowerCase();
    const routes = dept?.routes || {};
    for (const [key, route] of Object.entries(routes)) {
        if (key !== 'default' && lmLower.includes(key)) return route;
    }
    return routes.default || { primary: 'Shara-e-Faisal (M-9 Corridor)', avoid: 'Peak-hour arterials', police_block: 'Nearest intersection' };
};

export const dispatcher = async (state) => {
    const { signal, user_directive, classification } = state;
    const rawInput = signal?.raw_input || '';
    const crisisType = (classification?.type || '').toLowerCase();
    const landmark = (typeof classification?.location === 'object'
        ? classification.location?.landmark
        : classification?.location) || 'Karachi';

    const deptConfig = DEPT_ROUTING[crisisType] || DEPT_ROUTING.flood;
    const routeIntel = getRouteIntel(deptConfig, landmark);

    let directiveNote = '';
    if (user_directive) {
        directiveNote = `\nSOVEREIGN OVERRIDE DIRECTIVE: "${user_directive}" — Must be executed immediately.`;
    }

    // Build a fully operational heuristic directive
    const heuristicTriage = {
        threat_level: deptConfig.threat_base,
        category: deptConfig.category,
        department: deptConfig.department,
        call_number: deptConfig.call_number,
        immediate_action: `DISPATCH ${deptConfig.units.join(', ')} immediately to ${landmark}.`,
        route_directive: {
            primary_route: routeIntel.primary,
            avoid: routeIntel.avoid,
            police_block_required_at: routeIntel.police_block,
        },
        police_notification: `Notify ${
            classification?.zone_intel?.police_station || deptConfig.department === 'POLICE_FORCE' ? 'Traffic Police HQ' : 'nearest police station'
        } to clear route at ${routeIntel.police_block} immediately. Request traffic diversion on ${routeIntel.avoid}.`,
        units_dispatched: deptConfig.units,
        emergency_contact: deptConfig.call_number,
        reasoning: `${crisisType.toUpperCase()} crisis at ${landmark} classified as ${deptConfig.category}. ` +
            `Threat Level ${deptConfig.threat_base}/10. Routed to ${deptConfig.department} as primary responder. ` +
            `Primary approach: ${routeIntel.primary}. Avoid: ${routeIntel.avoid}. ` +
            `Police block required at: ${routeIntel.police_block}. ` +
            `${deptConfig.department === 'FIRE_BRIGADE' ? 'KFB HQ alerted on channel 16.' : ''} ` +
            `${deptConfig.department === 'RESCUE_1122' ? 'Edhi Foundation and 1122 both notified.' : ''}` +
            (user_directive ? ` SOVEREIGN DIRECTIVE applied: ${user_directive}.` : '')
    };

    const prompt = `You are the Sovereign Dispatcher for Karachi Emergency Command.
    CRISIS TYPE: ${crisisType.toUpperCase()}
    LOCATION: ${landmark}
    ZONE INTEL: ${JSON.stringify(classification?.zone_intel || {})}
    RAW SIGNAL: "${rawInput}"
    ${directiveNote}

    TASK — Be extremely specific, not generic:
    1. Assign Threat Level (1-10) and category. For "proactive_maintenance", threat level must be 5 and category "PREVENTATIVE_MAINTENANCE".
    2. Route to the correct department with call number. For "proactive_maintenance", routing must be to "KWSC_FWO".
    3. Name the SPECIFIC approach route to use from the nearest hub (avoid generics like "main road").
    4. State EXACTLY what traffic diversion is needed and which police station must clear which intersection.
    5. List specific units/assets to deploy (named vehicles, not "emergency units").
    6. Provide detailed step-by-step reasoning tied to this specific location.

    Respond ONLY in valid JSON: {
        "threat_level": number, "category": string, "department": string,
        "immediate_action": string, "route_directive": {"primary_route": string, "avoid": string, "police_block_required_at": string},
        "police_notification": string, "units_dispatched": [string], "emergency_contact": string, "reasoning": string
    }`;

    let result;
    try {
        const response = await flashModel.invoke([['user', prompt]]);
        result = safeParseJson(response.content, heuristicTriage);
    } catch (e) {
        console.warn('[Dispatcher] LLM unavailable — using operational heuristic triage engine.');
        result = heuristicTriage;
    }

    // Force and lock dispatch config for proactive maintenance regardless of LLM output
    if (crisisType === 'proactive_maintenance') {
        result.department = 'KWSC_FWO';
        result.category = 'PREVENTATIVE_MAINTENANCE';
        result.threat_level = 5;
        result.emergency_contact = '021-99231218';
        result.immediate_action = `DISPATCH KWSC Gulshan Suction Truck (KWSC-GUL-T1), FWO Central Sludge Clearance Unit (FWO-CEN-T1) immediately to ${landmark}.`;
        result.route_directive = {
            primary_route: 'University Road BRT Corridor (use specialized construction slip lanes)',
            avoid: 'BRT main construction channel during peak transit hours',
            police_block_required_at: 'NIPA Chowrangi to Hassan Square transit intersection'
        };
        result.police_notification = `Notify nearest police station to clear route at NIPA Chowrangi to Hassan Square transit intersection immediately. Request traffic diversion on BRT main construction channel during peak transit hours.`;
        result.units_dispatched = ['KWSC Gulshan Suction Truck (KWSC-GUL-T1)', 'FWO Central Sludge Clearance Unit (FWO-CEN-T1)'];
        result.reasoning = `PROACTIVE MAINTENANCE crisis at ${landmark} classified as PREVENTATIVE_MAINTENANCE. Threat Level 5/10. Routed to KWSC_FWO as primary responder. Primary approach: University Road BRT Corridor (use specialized construction slip lanes). Avoid: BRT main construction channel during peak transit hours. Police block required at: NIPA Chowrangi to Hassan Square transit intersection.`;
    }

    // Coordinated SLA override for exposed electrical wires
    const secondaryHazards = classification?.secondary_hazards || [];
    const isCoordinatedSLA = secondaryHazards.includes('exposed_electrical_wires');

    if (isCoordinatedSLA) {
        result.department = 'COORDINATED_SLA';
        result.category = 'LIFE_SAFETY_AND_INFRASTRUCTURE';
        result.threat_level = Math.max(result.threat_level || 5, 9); // Ensure high threat
        result.immediate_action = 'ACTIVATE COORDINATED SLA: Spawn parallel responder directives for Rescue 1122, K-Electric, and Traffic Police.';
        result.route_directive = {
            primary_route: routeIntel.primary || 'Direct Emergency Approach Route',
            avoid: routeIntel.avoid || 'Standard Hazard Radius',
            police_block_required_at: routeIntel.police_block || 'Incident perimeter junctions'
        };
        result.units_dispatched = [
            'Rescue 1122 Rapid Response Team',
            'K-Electric Grid Isolation Squad',
            'Traffic Police Perimeter Division'
        ];
        result.reasoning = `Flooding crisis at ${landmark} presents exposed electrical wire hazard. Coordinated SLA activated to execute parallel power grid isolation, emergency command, and perimeter traffic diversion.`;
    }

    const coordinatedSlaObj = isCoordinatedSLA ? {
        "Rescue 1122": {
            "task": "Primary emergency command and life-saving operations.",
            "status": "PENDING"
        },
        "K-Electric": {
            "task": "Isolate and shut off power in the specific flooded grid to prevent electrocution.",
            "status": "PENDING"
        },
        "Traffic Police": {
            "task": "Setup physical perimeter blocking and route diversions around the hazard zone.",
            "status": "PENDING"
        }
    } : null;

    console.log(`[Agent: The Dispatcher] Triage: dept=${result.department}, threat=${result.threat_level}, route="${result.route_directive?.primary_route}"`);
    console.log(`[Agent: The Dispatcher] Police block required at: ${result.route_directive?.police_block_required_at}`);
    console.log(`[Agent: The Dispatcher] Reasoning: ${result.reasoning}`);

    const log = {
        timestamp: new Date().toISOString(),
        agent: 'The Dispatcher',
        message: isCoordinatedSLA 
            ? `🚨 MULTI-AGENCY COORDINATED SLA ACTIVATED for flooding with exposed wires at ${landmark}. Parallel tasks assigned to Rescue 1122, K-Electric, and Traffic Police.`
            : `🚨 ${result.department.replace(/_/g, ' ')} DISPATCHED — Threat Level ${result.threat_level}/10 [${result.category}]. ` +
              `Route: ${result.route_directive?.primary_route}. Police block: ${result.route_directive?.police_block_required_at}. Contact: ${result.emergency_contact}`,
        outcome: isCoordinatedSLA ? 'Coordinated SLA' : 'Routed & Triaged',
        details: {
            ...result,
            coordinated_sla: coordinatedSlaObj
        },
    };

    return {
        triage: result,
        assigned_department: result.department,
        coordinated_sla: coordinatedSlaObj,
        traceLogs: [log],
    };
};
