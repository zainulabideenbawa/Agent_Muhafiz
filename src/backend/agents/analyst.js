import { proModel } from './models.js';
import { safeParseJson } from './parser.js';
import { get_rainfall_forecast } from '../tools.js';

// Karachi infrastructure risk by zone and crisis type
const INFRASTRUCTURE_RISKS = {
    fire: {
        saddar: {
            population: 42000,
            duration: '3-4 hours',
            spread: 'Rapid — dense commercial structures, LPG cylinders in Boulton Market, high combustible load in Empress Market stalls',
            risks: ['Empress Market heritage structure', 'Boulton Market LPG storage', 'Civil Hospital electrical grid', 'KESC power substation at Preedy Street'],
            hospitals_at_risk: ['Civil Hospital Karachi (0.8km)', 'Jinnah Hospital (1.2km)'],
        },
        nipa: {
            population: 28000,
            duration: '2-3 hours',
            spread: 'High — mix of residential towers and commercial plaza, wind direction toward University Road',
            risks: ['Aga Khan Hospital grid (critical proximity)', 'University Road flyover steel structure', 'Gulshan residential high-rises'],
            hospitals_at_risk: ['Aga Khan Hospital (0.4km) — CRITICAL PROXIMITY'],
        },
        gulshan: {
            population: 35000,
            duration: '2-3 hours',
            spread: 'Moderate-high — dense mid-rise residential with shared walls',
            risks: ['Liaquat National Hospital power supply', 'Block 13 gas mains', 'Gulshan Commercial Area'],
            hospitals_at_risk: ['Liaquat National Hospital (1.1km)', 'Aga Khan Hospital (2.5km)'],
        },
        clifton: {
            population: 22000,
            duration: '2 hours',
            spread: 'Moderate — open sea breeze may accelerate spread toward boat basin',
            risks: ['Boat Basin fuel storage', 'Clifton sea-view residential towers', 'Karachi Port fuel lines'],
            hospitals_at_risk: ['South City Hospital (1.5km)', 'Patel Hospital (2km)'],
        },
        default: {
            population: 15000,
            duration: '2-3 hours',
            spread: 'Moderate — standard commercial/residential zone',
            risks: ['Local power grid', 'LPG distribution network', 'Nearby commercial market'],
            hospitals_at_risk: ['Nearest government hospital (est. 2km)'],
        },
    },
    flood: {
        nipa: {
            population: 75000,
            duration: '8-12 hours post-rain',
            spread: 'CRITICAL — NIPA Chowrangi is Karachi\'s lowest drainage point, will submerge in 45 min of sustained rain',
            risks: ['NIPA underpass (complete submersion)', 'University Road complete blockage', 'Aga Khan Hospital basement parking', 'KDA drain overflow Sector 5'],
            hospitals_at_risk: ['Aga Khan Hospital (basement at flood risk)'],
        },
        karsaz: {
            population: 48000,
            duration: '6-10 hours',
            spread: 'High — Karsaz underpass accumulates 4-6 feet of water rapidly, Shara-e-Faisal blocks both ways',
            risks: ['Karsaz underpass complete closure', 'Shara-e-Faisal (Karachi\'s main N-S artery) paralysed', 'NICVD hospital access blocked'],
            hospitals_at_risk: ['NICVD (National Institute of Cardiovascular Diseases) — road access at risk'],
        },
        saddar: {
            population: 55000,
            duration: '4-8 hours',
            spread: 'High — Regal Chowk historically records 3+ feet water depth, City Station area becomes inaccessible',
            risks: ['Regal Chowk complete submersion', 'M.A. Jinnah Road drainage failure', 'Empress Market basement flooding', 'City Railway Station access blocked'],
            hospitals_at_risk: ['Civil Hospital Karachi (supply routes at risk)'],
        },
        gulshan: {
            population: 62000,
            duration: '5-8 hours',
            spread: 'High — Block 13 known drainage failure point, KDA nala overflows onto main boulevard',
            risks: ['Block 13 underpass', 'KDA Nala overflow (confirmed flood point)', 'Gulshan-e-Iqbal main boulevard'],
            hospitals_at_risk: ['Liaquat National Hospital (access road floods)'],
        },
        default: {
            population: 30000,
            duration: '4-8 hours',
            spread: 'Moderate-high — standard Karachi drainage failure zone',
            risks: ['Low-lying roads', 'Underpasses', 'Drainage network overflow'],
            hospitals_at_risk: ['Nearest government hospital — route access at risk'],
        },
    },
    blast: {
        default: {
            population: 8000,
            duration: '12-24 hours (site secured)',
            spread: 'Immediate 200m debris radius; secondary IED risk if vehicle-borne',
            risks: ['500m evacuation zone mandatory', 'Gas main rupture risk', 'Structural collapse of adjacent buildings', 'Secondary device risk'],
            hospitals_at_risk: ['Trauma bay required at 2+ hospitals simultaneously'],
        },
    },
    protest: {
        university_road: {
            population: 120000,
            duration: '4-8 hours',
            spread: 'Network cascading — University Road closure backs up Rashid Minhas + Shaheed-e-Millat causing city-wide gridlock',
            risks: ['University Road (full closure)', 'Ambulance route to Aga Khan Hospital blocked', 'NIPA-Gulshan corridor collapse'],
            hospitals_at_risk: ['Aga Khan Hospital ambulance access blocked — CRITICAL'],
        },
        saddar: {
            population: 85000,
            duration: '3-6 hours',
            spread: 'High — Saddar shutdown blocks access to 3 major hospitals and city railway station',
            risks: ['Civil + Jinnah Hospital access cut off', 'City Station access lost', 'M.A. Jinnah Road (national artery) paralysed'],
            hospitals_at_risk: ['Civil Hospital Karachi', 'Jinnah Hospital — ambulance access at risk'],
        },
        default: {
            population: 40000,
            duration: '3-6 hours',
            spread: 'Moderate — local road network disrupted, alternate routes available',
            risks: ['Primary road closure', 'Emergency vehicle access disrupted'],
            hospitals_at_risk: ['Nearest hospital — access route at risk'],
        },
    },
    proactive_maintenance: {
        university_road: {
            population: 95000,
            duration: 'Pre-emptive: 2-3 hours sludge suction operation',
            spread: 'Preventative — sludge clearance along BRT Red Line drainage corridor to prevent massive traffic paralysis before the storm hits',
            risks: ['BRT Red Line construction corridor drainage lines', 'University Road main sewage arteries', 'NIPA Chowrangi drainage channels'],
            hospitals_at_risk: ['Aga Khan Hospital access routes (preventative standby)', 'Liaquat National Hospital access routes (preventative standby)'],
        },
        default: {
            population: 95000,
            duration: 'Pre-emptive: 2-3 hours sludge suction operation',
            spread: 'Preventative — sludge clearance along BRT Red Line drainage corridor to prevent massive traffic paralysis before the storm hits',
            risks: ['BRT Red Line construction corridor drainage lines', 'University Road main sewage arteries', 'NIPA Chowrangi drainage channels'],
            hospitals_at_risk: ['Aga Khan Hospital access routes (preventative standby)', 'Liaquat National Hospital access routes (preventative standby)'],
        }
    }
};

const getZoneRisk = (crisisType, landmark) => {
    const lmLower = (landmark || '').toLowerCase();
    const crisisRisks = INFRASTRUCTURE_RISKS[crisisType] || INFRASTRUCTURE_RISKS.flood;
    for (const [zone, data] of Object.entries(crisisRisks)) {
        if (zone !== 'default' && lmLower.includes(zone)) return data;
    }
    return crisisRisks.default || INFRASTRUCTURE_RISKS.flood.default;
};

export const analyst = async (state) => {
    const landmark = state.classification?.location?.landmark || 'Karachi';
    const lat = state.classification?.location?.lat || 24.8607;
    const lng = state.classification?.location?.lng || 67.0011;
    const crisisType = (state.classification?.type || 'flood').toLowerCase();
    const isFlood = crisisType.includes('flood');
    const zoneRisk = getZoneRisk(crisisType, landmark);

    // Fetch real rainfall forecast for flood crises
    let forecast = { total_rainfall_6h_mm: 0, flood_risk: 'UNKNOWN', source: 'unavailable' };
    if (isFlood) {
        forecast = await get_rainfall_forecast(lat, lng);
        console.log(`[Analyst/Open-Meteo] Rainfall: ${forecast.total_rainfall_6h_mm}mm/6h, risk=${forecast.flood_risk}`);
    }

    // Build a rich, specific analysis
    let estimatedDuration = zoneRisk.duration;
    let affectedPop = zoneRisk.population;
    let spreadPrediction = zoneRisk.spread;

    if (isFlood && forecast.flood_risk === 'HIGH') {
        affectedPop = Math.round(affectedPop * 1.4);
        spreadPrediction = `EXTREME — Open-Meteo confirms ${forecast.total_rainfall_6h_mm}mm expected in next 6 hours. ${zoneRisk.spread}`;
        estimatedDuration = '10-16 hours (sustained rain event)';
    } else if (isFlood && forecast.flood_risk === 'MODERATE') {
        spreadPrediction = `HIGH — ${forecast.total_rainfall_6h_mm}mm forecast over 6h. ${zoneRisk.spread}`;
    }

    const heuristicAnalysis = {
        impact_analysis: {
            estimated_duration: estimatedDuration,
            affected_population: affectedPop,
            critical_infrastructure_risk: zoneRisk.risks,
            hospitals_at_risk: zoneRisk.hospitals_at_risk,
            spread_prediction: spreadPrediction,
            rainfall_forecast: isFlood && forecast.source !== 'unavailable' ? `${forecast.total_rainfall_6h_mm}mm / 6h — Risk: ${forecast.flood_risk} (Open-Meteo live)` : null,
            reasoning: `${crisisType.toUpperCase()} at ${landmark}: ` +
                `${spreadPrediction}. ` +
                `Estimated ${affectedPop.toLocaleString()} citizens impacted over ${estimatedDuration}. ` +
                `Critical infrastructure at risk: ${zoneRisk.risks.join(', ')}. ` +
                `Hospital proximity alerts: ${zoneRisk.hospitals_at_risk.join(', ')}.` +
                (isFlood && forecast.source !== 'unavailable' ? ` Open-Meteo 6h rainfall forecast: ${forecast.total_rainfall_6h_mm}mm — Flood risk classification: ${forecast.flood_risk}.` : '')
        }
    };

    const systemPrompt = `You are the Impact Analyst for Karachi Emergency Response.
    CRISIS: ${crisisType.toUpperCase()} at ${landmark}
    CLASSIFICATION: ${JSON.stringify(state.classification)}
    ${isFlood ? `LIVE RAINFALL FORECAST (Open-Meteo): ${JSON.stringify(forecast)}` : ''}
    ZONE INTEL: ${JSON.stringify(state.classification?.zone_intel || {})}
    
    TASK — Be specific to ${landmark}, NOT generic:
    1. Name SPECIFIC streets, buildings, hospitals and infrastructure at risk.
    2. Estimate spread based on the actual terrain of ${landmark} (density, drainage, wind).
    3. Quantify affected population with reasoning.
    4. State exact hospital proximity risks with distances.
    
    Respond ONLY in valid JSON:
    { "impact_analysis": { "estimated_duration": string, "affected_population": number, "critical_infrastructure_risk": [string], "hospitals_at_risk": [string], "spread_prediction": string, "reasoning": string } }`;

    let result;
    try {
        const response = await proModel.invoke([
            ['system', systemPrompt],
            ['user', 'Generate specific impact prediction for this crisis and location.']
        ]);
        result = safeParseJson(response.content, heuristicAnalysis);
    } catch (e) {
        console.warn('[Analyst] LLM unavailable — using zone-specific heuristic analysis.');
        result = heuristicAnalysis;
    }

    const riskList = Array.isArray(result.impact_analysis?.critical_infrastructure_risk)
        ? result.impact_analysis.critical_infrastructure_risk.join(', ')
        : (result.impact_analysis?.critical_infrastructure_risk || 'Local infrastructure');

    console.log(`[Agent: The Analyst] Duration: ${result.impact_analysis?.estimated_duration}, Population: ${result.impact_analysis?.affected_population}, Spread: ${result.impact_analysis?.spread_prediction}`);

    const log = {
        timestamp: new Date().toISOString(),
        agent: 'The Analyst',
        message: `📊 Impact analysis for ${crisisType.toUpperCase()} at ${landmark}: ` +
            `~${(result.impact_analysis?.affected_population || 0).toLocaleString()} citizens affected over ${result.impact_analysis?.estimated_duration}. ` +
            `Spread: ${result.impact_analysis?.spread_prediction?.substring(0, 120)}...`,
        outcome: 'Analysis Complete',
        details: result.impact_analysis,
    };

    return {
        impact_analysis: result.impact_analysis,
        traceLogs: [log],
    };
};
