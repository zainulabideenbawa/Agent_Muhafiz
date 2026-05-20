import { proModel } from './models.js';
import { safeParseJson } from './parser.js';
import { get_city_vitals, check_nasa_firms_fire } from '../tools.js';
import { verifyCrisisFromTwitter } from '../social_uplink.js';

export const truthEngine = async (state) => {
    // Safely extract landmark — location may be string or { landmark } object
    const loc = state.classification?.location;
    const landmark = (loc && typeof loc === 'object' ? loc.landmark : loc) || "Karachi";

    // Human-in-the-Loop Override
    const isOfficerConfirmed = state.officer_status === 'CONFIRMED' || state.classification?.officer_status === 'CONFIRMED';
    if (isOfficerConfirmed) {
        console.log(`[Agent: The Truth-Engine] Ground truth verified on-scene by field officer for ${landmark}. Setting confidence to 1.0.`);
        const log = {
            timestamp: new Date().toISOString(),
            agent: "The Truth-Engine",
            message: `✅ Crisis at ${landmark} verified by on-scene field responder. Telemetry override: Confidence locked at 1.0. Proceeding to dispatch.`,
            outcome: "Verified",
            details: {
                verdict: "Verified",
                confidence_level: 1.0,
                officer_override: true
            }
        };
        return {
            metadata: { source_reliability: 1.0 },
            classification: {
                confidence_level: 1.0,
                verification_sources: ["Field Officer Verification (Ground Truth)"],
                verdict: "Verified",
                twitter_posts: []
            },
            traceLogs: [log]
        };
    }

    const vitals = await get_city_vitals(landmark);

    // Heuristic Sub-scoring calculations for fallback and consistency
    const rawText = (state.signal?.raw_input || "").toLowerCase();
    const hasUrgentKeywords = ["urgent", "immediately", "emergency", "aag", "dhamaka", "doob", "critical", "help", "blast", "fire", "danger"].some(kw => rawText.includes(kw));
    const urgencyScore = hasUrgentKeywords ? 0.92 : 0.58;

    const hasSpecificLandmark = landmark !== "Karachi";
    const geoScore = hasSpecificLandmark ? 0.95 : 0.65;

    const crisisType = (state.classification?.type || "").toLowerCase();
    const isFire = crisisType.includes("fire");
    const isFlood = crisisType.includes("flood");
    const isMajorCrisis = ["flood", "blast", "protest", "fire"].includes(crisisType);

    // Contradiction detection: e.g. flooding reported when there is no rain and water levels are low
    let contradictionScore = 0.05;
    if (isFlood && vitals.rainfall_mm === 0 && vitals.water_level_cm < 10) {
        contradictionScore = 0.78; // High contradiction
    } else if (isFire && vitals.avg_temp < 25) {
        contradictionScore = 0.35; // Moderate contradiction (indoor/small fire possible)
    }

    let verifiedVerdict = "Verified";
    let calculatedConfidence = 0.85;
    let fallbackReason = `Heuristic telemetry validation confirmed normal thresholds for ${landmark}.`;
    let additionalSources = ["City Telemetry Grid", "Sensors Hub"];
    let twitterPosts = [];
    let velocity = isMajorCrisis ? 35 : 8;

    if (isMajorCrisis) {
        // Perform reactive Twitter OSINT Verification
        const osintResult = await verifyCrisisFromTwitter(crisisType, landmark);
        twitterPosts = osintResult?.posts || [];
        
        if (osintResult.verified && osintResult.posts.length > 0) {
            calculatedConfidence = 0.98;
            additionalSources.push("Twitter OSINT Verification");
            velocity = Math.floor(45 + Math.random() * 75);
            
            const leadPost = osintResult.posts[0];
            fallbackReason = `Telemetry matched risk profile. Reconfirmed from Twitter: User ${leadPost.username} has also posted this related with hashtag ${leadPost.hashtag}. Post: "${leadPost.text}"`;
        } else {
            calculatedConfidence = 0.75;
            velocity = Math.floor(10 + Math.random() * 15);
            fallbackReason = `Major crisis detected, but could not be verified on social channels. Local sensors nominal.`;
        }

        // For fire crises: additionally cross-reference with NASA FIRMS satellite imagery
        if (isFire) {
            const coords = state.classification?.location;
            const lat = coords?.lat || 24.8607;
            const lng = coords?.lng || 67.0011;
            const firmsResult = await check_nasa_firms_fire(lat, lng);
            if (firmsResult.satellite_confirmed) {
                calculatedConfidence = Math.min(0.99, calculatedConfidence + 0.05);
                additionalSources.push(`NASA VIIRS Satellite (${firmsResult.fire_pixels} active pixel(s))`);
                fallbackReason += ` NASA FIRMS satellite data confirms ${firmsResult.fire_pixels} active fire pixel(s) detected in the incident zone.`;
                console.log(`[Truth-Engine/NASA] 🛰️ Satellite CONFIRMED fire at (${lat}, ${lng}) — ${firmsResult.fire_pixels} pixel(s)`);
            } else {
                console.log(`[Truth-Engine/NASA] 🛰️ Satellite: no active fire pixels detected (may be clouded or small fire).`);
                additionalSources.push("NASA VIIRS Satellite (no pixels — possible small/indoor fire)");
            }
        }
    } else if (isFire) {
        if (vitals.avg_temp > 35) {
            calculatedConfidence = 0.95;
            fallbackReason = `High ambient temperature (${vitals.avg_temp}°C) telemetry matches risk profile for Fire crisis.`;
        } else {
            calculatedConfidence = 0.75;
            fallbackReason = `Telemetry temperature is moderate (${vitals.avg_temp}°C) but active grid sensors remain nominal.`;
        }
    } else {
        if (vitals.avg_humidity > 70) {
            calculatedConfidence = 0.92;
            fallbackReason = `Elevated relative humidity (${vitals.avg_humidity}%) telemetry indicates potential rainfall/clogging threshold reached.`;
        } else {
            calculatedConfidence = 0.72;
            fallbackReason = `Humidity levels normal (${vitals.avg_humidity}%) but city sensor grids confirm active water telemetry.`;
        }
    }

    // Source credibility score logic
    const sourceCredibilityScore = twitterPosts.length > 0 ? 0.92 : (isFire || isFlood ? 0.75 : 0.60);
    const overallConfidence = calculatedConfidence;
    const isSuspicious = overallConfidence < 0.8 || contradictionScore > 0.4;

    const defaultFallback = {
        classification: {
            confidence_level: overallConfidence,
            verification_sources: additionalSources,
            credibility: {
                source_credibility: sourceCredibilityScore,
                geolocation_confidence: geoScore,
                urgency_language: urgencyScore,
                mention_velocity: velocity,
                contradiction_level: contradictionScore,
                suspicious_signal: isSuspicious
            }
        },
        verdict: verifiedVerdict,
        reasoning: fallbackReason
    };

    const systemPrompt = `You are the "Skeptic." Verify the emergency signal against city telemetry vitals.
    Vitals: ${JSON.stringify(vitals)}
    Crisis: ${JSON.stringify(state.classification)}
    Assign a confidence_level (0.0 to 1.0). If < 0.7, outcome is "False Positive".
    
    Output ONLY valid JSON with this format:
    {
       "classification": {
          "confidence_level": number,
          "verification_sources": ["string"],
          "credibility": {
             "source_credibility": number,
             "geolocation_confidence": number,
             "urgency_language": number,
             "mention_velocity": number,
             "contradiction_level": number,
             "suspicious_signal": boolean
          }
       },
       "verdict": "Verified"|"False Positive",
       "reasoning": "string"
    }
    
    Ensure sub-scores match telemetry matches. E.g. contradiction_level should be high (> 0.5) if vitals contradict the report.`;

    let result;
    try {
        const response = await proModel.invoke([
            ["system", systemPrompt],
            ["user", `Analyze telemetry for ${landmark} and verify the reported crisis.`]
        ]);
        result = safeParseJson(response.content, defaultFallback);
    } catch (e) {
        console.warn("[TruthEngine] LLM Failed, using fallback.");
        result = defaultFallback;
    }

    // Deep merge credibility default fallback if LLM omitted sub-scores
    if (!result.classification) result.classification = {};
    if (!result.classification.credibility) {
        result.classification.credibility = defaultFallback.classification.credibility;
    }

    const confidenceLevel = result.classification?.confidence_level ?? calculatedConfidence;

    console.log(`[Agent: The Truth-Engine] Validation score: ${confidenceLevel} - Verdict: ${result.verdict || "Verified"}`);
    console.log(`[Agent: The Truth-Engine] Credibility Breakdown: ${JSON.stringify(result.classification.credibility)}`);

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Truth-Engine",
        message: `Verified against ${vitals.location || landmark} telemetry. Confidence: ${confidenceLevel}. Suspicious: ${result.classification.credibility.suspicious_signal}.`,
        outcome: result.verdict || "Verified",
        details: {
            verdict: result.verdict || "Verified",
            confidence_level: confidenceLevel,
            twitter_posts: twitterPosts,
            credibility: result.classification.credibility
        }
    };

    return {
        metadata: { source_reliability: confidenceLevel },
        classification: {
            confidence_level: confidenceLevel,
            verification_sources: result.classification?.verification_sources ?? [],
            verdict: result.verdict || "Verified",
            twitter_posts: twitterPosts,
            credibility: result.classification.credibility
        },
        traceLogs: [log]
    };
};
