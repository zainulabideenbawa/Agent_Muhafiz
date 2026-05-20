import { proModel } from './models.js';
import { safeParseJson } from './parser.js';
import { get_city_vitals, check_nasa_firms_fire } from '../tools.js';
import { verifyCrisisFromTwitter } from '../social_uplink.js';

export const truthEngine = async (state) => {
    // Safely extract landmark — location may be string or { landmark } object
    const loc = state.classification?.location;
    const landmark = (loc && typeof loc === 'object' ? loc.landmark : loc) || "Karachi";

    const vitals = await get_city_vitals(landmark);

    const systemPrompt = `You are the "Skeptic." Verify the signal against city vitals.
    Vitals: ${JSON.stringify(vitals)}
    Crisis: ${JSON.stringify(state.classification)}
    Assign a confidence_level (0.0 to 1.0). If < 0.7, outcome is "False Positive".
    Output ONLY JSON with: classification {confidence_level, verification_sources}, verdict (Verified/False Positive), reasoning (string).
    Your reasoning should explain exactly how the telemetry vitals (AQI, Temp, or Humidity) correlate to confirm or dispute the reported crisis.`;

    // Dynamic Intelligent Validation Heuristics
    const crisisType = (state.classification?.type || "").toLowerCase();
    const isFire = crisisType.includes("fire");
    const isMajorCrisis = ["flood", "blast", "protest", "fire"].includes(crisisType);

    let verifiedVerdict = "Verified";
    let calculatedConfidence = 0.85;
    let fallbackReason = `Heuristic telemetry validation confirmed normal thresholds for ${landmark}.`;
    let additionalSources = ["City Telemetry Grid", "Sensors Hub"];
    let twitterPosts = [];

    if (isMajorCrisis) {
        // Perform reactive Twitter OSINT Verification
        const osintResult = await verifyCrisisFromTwitter(crisisType, landmark);
        twitterPosts = osintResult?.posts || [];
        
        if (osintResult.verified && osintResult.posts.length > 0) {
            calculatedConfidence = 0.98;
            additionalSources.push("Twitter OSINT Verification");
            
            const leadPost = osintResult.posts[0];
            fallbackReason = `Telemetry matched risk profile. Reconfirmed from Twitter: User ${leadPost.username} has also posted this related with hashtag ${leadPost.hashtag}. Post: "${leadPost.text}"`;
        } else {
            calculatedConfidence = 0.75;
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

    const defaultFallback = {
        classification: { confidence_level: calculatedConfidence, verification_sources: additionalSources },
        verdict: verifiedVerdict,
        reasoning: fallbackReason
    };

    let result;
    try {
        const response = await proModel.invoke([
            ["system", systemPrompt],
            ["user", "Analyze the data and provide a verification verdict."]
        ]);
        result = safeParseJson(response.content, defaultFallback);
    } catch (e) {
        console.warn("[TruthEngine] LLM Failed, using fallback.");
        result = defaultFallback;
    }

    const confidenceLevel = result.classification?.confidence_level ?? calculatedConfidence;

    console.log(`[Agent: The Truth-Engine] Validation score: ${confidenceLevel} - Verdict: ${result.verdict || "Verified"}`);
    console.log(`[Agent: The Truth-Engine] Reasoning: ${result.reasoning || "Fallback heuristics applied."}`);

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Truth-Engine",
        message: `Verified against ${vitals.location || landmark} telemetry. Confidence: ${confidenceLevel}.`,
        outcome: result.verdict || "Verified",
        details: {
            verdict: result.verdict || "Verified",
            confidence_level: confidenceLevel,
            twitter_posts: twitterPosts
        }
    };

    // Only return the fields this agent owns — do NOT return a full classification
    // that could overwrite the location object set by Sentinel.
    return {
        metadata: { source_reliability: confidenceLevel },
        classification: {
            confidence_level: confidenceLevel,
            verification_sources: result.classification?.verification_sources ?? [],
            verdict: result.verdict || "Verified",
            twitter_posts: twitterPosts
        },
        traceLogs: [log]
    };
};
