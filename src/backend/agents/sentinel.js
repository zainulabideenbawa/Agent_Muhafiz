import { flashModel } from './models.js';
import { safeParseJson } from './parser.js';
import { get_gps_from_google_maps } from '../tools.js';

export const sentinel = async (state) => {
    const isSocial = (state.signal?.raw_input || "").includes('@') || (state.signal?.raw_input || "").includes('#');

    const prompt = `You are The Sentinel, the first line of defense for Karachi's Urban Governance.
    INPUT SOURCE: ${isSocial ? 'OSINT_SOCIAL_MEDIA' : 'GOVT_MOBILE_APP'}
    INPUT TEXT: "${state.signal?.raw_input || ""}"

    Task:
    1. Determine if this is an actionable urban emergency (Flood, Fire, Blast, or Protest).
    2. Extract the primary landmark/location.
    3. If OSINT, be critical of the source but prioritize potential lives at risk.
    4. Provide your step-by-step reasoning explaining how you analyzed the signal to determine the location and crisis state.

    Respond in JSON: { "is_crisis": boolean, "type": "fire" | "flood" | "blast" | "protest", "location": "string", "urgency": 1-10, "reasoning": "string" }`;

    // Dynamic Intelligent Extractor Fallback
    const rawLower = (state.signal?.raw_input || "").toLowerCase();
    const isCrisis = rawLower.includes("aag") || rawLower.includes("fire") || rawLower.includes("jal") || rawLower.includes("doob") || rawLower.includes("pani") || rawLower.includes("flood") || rawLower.includes("water") || rawLower.includes("rain") || rawLower.includes("blast") || rawLower.includes("dhamaka") || rawLower.includes("explosion") || rawLower.includes("bomb") || rawLower.includes("protest") || rawLower.includes("dharna") || rawLower.includes("strike") || rawLower.includes("rally");
    
    let extractedType = "flood";
    if (rawLower.includes("aag") || rawLower.includes("fire") || rawLower.includes("jal")) extractedType = "fire";
    else if (rawLower.includes("blast") || rawLower.includes("dhamaka") || rawLower.includes("explosion") || rawLower.includes("bomb")) extractedType = "blast";
    else if (rawLower.includes("protest") || rawLower.includes("dharna") || rawLower.includes("strike") || rawLower.includes("rally")) extractedType = "protest";
    
    // Simple heuristic location extractor
    let extractedLoc = "Karachi";
    const areas = ["liaquatabad", "saddar", "clifton", "nipa", "gulshan", "defence", "karsaz", "nazimabad", "dha", "johar"];
    for (const area of areas) {
        if (rawLower.includes(area)) {
            extractedLoc = area.charAt(0).toUpperCase() + area.slice(1);
            break;
        }
    }

    const defaultFallback = {
        is_crisis: isCrisis,
        type: extractedType,
        location: extractedLoc,
        urgency: extractedType === "fire" || extractedType === "blast" ? 9 : 7,
        reasoning: `Heuristically evaluated input: crisis=${isCrisis}, location matched=${extractedLoc}.`
    };

    let result;
    try {
        const response = await flashModel.invoke([["user", prompt]]);
        result = safeParseJson(response.content, defaultFallback);
    } catch (e) {
        console.warn("[Sentinel] LLM Failed or Quota Exceeded, using dynamic heuristic fallback.");
        result = defaultFallback;
    }

    // Ensure location is always a clean string
    const locationStr = (typeof result.location === 'string' && result.location)
        ? result.location
        : extractedLoc;

    // Geocode the extracted landmark using Google Maps API
    const coords = await get_gps_from_google_maps(locationStr);

    console.log(`[Agent: The Sentinel] Evaluated signal: is_crisis=${result.is_crisis}, type=${result.type}, landmark=${locationStr}, urgency=${result.urgency}`);
    console.log(`[Agent: The Sentinel] Coordinates: Lat=${coords.lat}, Lng=${coords.lng}`);
    console.log(`[Agent: The Sentinel] Reasoning: ${result.reasoning || "Fallback heuristics applied."}`);

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Sentinel",
        message: result.is_crisis
            ? `Actionable ${result.type} detected at ${locationStr} via ${isSocial ? 'Twitter' : 'App'}.`
            : "No immediate urban threat detected in signal.",
        outcome: result.is_crisis ? "Success" : "Filtered",
        source: isSocial ? 'SOCIAL' : 'APP',
        details: {
            ...result,
            location: { landmark: locationStr, lat: coords.lat, lng: coords.lng }
        }
    };

    return {
        incident_id: state.metadata?.incidentId || state.incident_id || `MHFZ-${Date.now().toString().slice(-4)}`,
        signal: { source: isSocial ? 'SOCIAL' : 'APP' },
        // Always set a complete classification with a proper location object containing Maps GPS
        classification: {
            type: result.is_crisis ? result.type : 'UNCLASSIFIED',
            location: { landmark: locationStr, lat: coords.lat, lng: coords.lng },
            urgency: result.is_crisis ? (result.urgency || 5) : 0,
            is_crisis: result.is_crisis,
        },
        traceLogs: [log]
    };
};
