import { proModel } from './models.js';
import { safeParseJson } from './parser.js';
import { get_resource_status, get_nearest_infrastructure, get_route_eta } from '../tools.js';

export const strategist = async (state) => {
    const resources = await get_resource_status(state.assigned_department);

    // Safely resolve landmark from either { landmark } object or plain string
    const loc = state.classification?.location;
    const landmark = (loc && typeof loc === 'object' ? loc.landmark : loc) || "Karachi";
    const lat = loc?.lat || 24.8607;
    const lng = loc?.lng || 67.0011;
    const crisisType = state.classification?.type || 'flood';

    // Find REAL nearest infrastructure from OpenStreetMap (Overpass API — free, no key)
    const nearbyInfra = await get_nearest_infrastructure(lat, lng, crisisType);
    const nearestFacility = nearbyInfra.found && nearbyInfra.results[0]
        ? nearbyInfra.results[0].name
        : null;
    if (nearestFacility) {
        console.log(`[Strategist/Overpass] ✅ Nearest ${nearbyInfra.amenity}: "${nearestFacility}"`);
    }
    // Get real TomTom routing ETA from Karachi hub to incident location
    // Using KMC Fire HQ (24.8739, 67.0250) as origin proxy for fire, KMC center otherwise
    const hubCoords = crisisType.toLowerCase().includes('fire')
        ? { lat: 24.8739, lng: 67.0250 }   // Karachi Fire Brigade HQ
        : { lat: 24.8607, lng: 67.0011 };   // KMC City Centre
    const routeEta = await get_route_eta(hubCoords.lat, hubCoords.lng, lat, lng);
    console.log(`[Strategist/TomTom] Real ETA to ${landmark}: ${routeEta.eta_mins} min, ${routeEta.distance_km}km (${routeEta.source})`);

    const confidenceStr = state.classification?.confidence_level
        ? `${Math.round(state.classification.confidence_level * 100)}%`
        : 'N/A';

    const prompt = `You are the Sovereign Strategist for ${state.assigned_department || 'RESCUE_1122'}.
    LOCATION: ${landmark}
    AVAILABLE FLEET: ${JSON.stringify(resources.hubs)}
    VERIFIED TRUTH: ${JSON.stringify(state.classification)}

    Task:
    1. Select the exact HUB for deployment from the AVAILABLE FLEET.
    2. Specify units (e.g., Heavy Tanker, Life-Support Ambulance).
    3. ETA based on REAL TomTom traffic routing: ${routeEta.eta_mins} min from hub to scene (${routeEta.distance_km ? routeEta.distance_km + 'km, ' : ''}source: ${routeEta.source}${routeEta.delay_mins > 0 ? ', traffic delay: ' + routeEta.delay_mins + ' min' : ''}).${nearestFacility ? ' Nearest ' + nearbyInfra.amenity + ' confirmed via OpenStreetMap: ' + nearestFacility + '.' : ''}
    4. Provide a 'Tactical Directive' for field staff (including traffic diversions).
    5. Provide your step-by-step reasoning explaining how you matched the severity, type of crisis, and closest operational hub to allocate these specific assets.

    Respond in JSON: {
        "priority_level": "CRITICAL" | "STANDARD",
        "deployment": { "hub": "string", "units": ["string"], "eta_mins": number },
        "tactical_directive": "string",
        "inter_agency_coordination": "string",
        "reasoning": "string"
    }`;

    // Dynamic Intelligent Strategic Fallback
    const firstHubName = nearestFacility || (resources.hubs && resources.hubs[0]?.name) || 'Karachi Central Station';
    const realEta = routeEta.eta_mins;
    const etaLabel = routeEta.source !== 'Simulated' ? `${realEta} min (TomTom live)` : `${realEta} min (est.)`;
    const calculatedUnits = (state.assigned_department === 'FIRE_BRIGADE')
        ? ['Heavy Water Tanker', 'Rescue Team Alpha']
        : (state.assigned_department === 'KMC_HEALTH' ? ['Water Suction Pump', 'Emergency Excavator'] : ['First-Responder Ambulance', 'Paramedic Squad']);
    // Flat structure matching what LLM returns — deployment directly on result
    const defaultFallback = {
        priority_level: 'CRITICAL',
        deployment: { hub: firstHubName, units: calculatedUnits, eta_mins: realEta },
        tactical_directive: `All units from ${firstHubName} ordered to converge on ${landmark} immediately. ETA: ${etaLabel}. TomTom traffic-aware route active. Establish 200m exclusion zone on arrival.`,
        inter_agency_coordination: `COORDINATE with ${state.assigned_department === 'FIRE_BRIGADE' ? 'RESCUE_1122 & Edhi Ambulances' : 'KFB Fire Units & Traffic Police'} for joint response. KMC Traffic Control alerted.`,
        reasoning: `Deployed ${calculatedUnits.join(' & ')} from "${firstHubName}"${nearestFacility ? ' (OSM verified)' : ''}. TomTom routing: ${etaLabel} to ${landmark}.`
    };
    console.log(`[Strategist] Fallback plan: hub=${firstHubName}, ETA=${etaLabel}, units=${calculatedUnits.join(', ')}`);

    let result;
    try {
        const response = await proModel.invoke([["user", prompt]]);
        result = safeParseJson(response.content, defaultFallback);
    } catch (e) {
        console.warn("[Strategist] LLM Failed or Quota Exceeded, using dynamic heuristic fallback.");
        result = defaultFallback;
    }

    const unitsDispatched = Array.isArray(result.deployment?.units)
        ? result.deployment.units.join(", ")
        : "Rescue Units";

    console.log(`[Agent: The Strategist] Tactical locked: hub=${result.deployment?.hub}, units=${unitsDispatched}, eta=${result.deployment?.eta_mins} mins`);
    console.log(`[Agent: The Strategist] Reasoning: ${result.reasoning || "Fallback heuristics applied."}`);

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Strategist",
        message: `TACTICAL DIRECTIVE: ${unitsDispatched} dispatched from ${result.deployment?.hub || "Central Hub"}. ETA: ${result.deployment?.eta_mins || 15} mins. ${result.tactical_directive || ""}`,
        outcome: "Plan Locked",
        details: result
    };

    return {
        action_plan: result,
        deployment: result.deployment,
        traceLogs: [log]
    };
};
