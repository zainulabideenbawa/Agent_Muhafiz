import { START, END, StateGraph } from "@langchain/langgraph";
import { sentinel } from './sentinel.js';
import { dispatcher } from './dispatcher.js';
import { truthEngine } from './truth_engine.js';
import { analyst } from './analyst.js';
import { strategist } from './strategist.js';
import { oracle } from './oracle.js';
import { communicator } from './communicator.js';
import { auditor } from './auditor.js';

const crisisStateSchema = {
    incident_id: { value: (prev, curr) => curr || prev, default: () => null },
    metadata: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    signal: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    classification: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    impact_analysis: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    action_plan: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    simulation: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    communication: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    audit_trail: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    assigned_department: { value: (prev, curr) => curr || prev, default: () => null },
    officer_status: { value: (prev, curr) => curr || prev, default: () => null },
    traceLogs: { value: (prev, curr) => prev.concat(curr), default: () => [] }
};

/**
 * HITL Halt Node — triggered when TruthEngine confidence < 0.8.
 * Sets status to QUEST_ACTIVE and surfaces a field verification alert
 * instead of blindly deploying assets on an unverified signal.
 */
const questHalt = async (state) => {
    const loc = state.classification?.location?.landmark || 'Karachi';
    const type = state.classification?.type || 'Unknown';
    const confidence = state.classification?.confidence_level ?? 0;
    const pct = (confidence * 100).toFixed(0);

    console.warn(`[HITL] Confidence ${pct}% < 80% threshold. Halting pipeline. Quest emitted for ${type} at ${loc}.`);

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Truth-Engine",
        message: `⚠️ VERIFICATION QUEST: ${type.toUpperCase()} at ${loc} — Confidence ${pct}% below 80% threshold. Awaiting field officer ground-truth before asset deployment.`,
        outcome: "Quest Active",
        details: {
            confidence_level: confidence,
            location: loc,
            type,
            quest_reason: `Telemetry confidence score of ${pct}% is insufficient to authorise autonomous deployment. Human-in-the-loop verification required.`
        }
    };

    return { traceLogs: [log] };
};

/** Conditional router: high-confidence → full pipeline, low-confidence → HITL quest */
const routeAfterTruthEngine = (state) => {
    const confidence = state.classification?.confidence_level ?? 1.0;
    return confidence >= 0.8 ? "TheDispatcher" : "QuestHalt";
};

const workflow = new StateGraph({ channels: crisisStateSchema });

workflow.addNode("TheDispatcher", dispatcher);
workflow.addNode("TheSentinel", sentinel);
workflow.addNode("TheTruthEngine", truthEngine);
workflow.addNode("TheAnalyst", analyst);
workflow.addNode("TheStrategist", strategist);
workflow.addNode("TheOracle", oracle);
workflow.addNode("TheCommunicator", communicator);
workflow.addNode("TheAuditor", auditor);
workflow.addNode("QuestHalt", questHalt);

workflow.addEdge(START, "TheSentinel");
workflow.addEdge("TheSentinel", "TheTruthEngine");

// HITL conditional branch after verification
workflow.addConditionalEdges("TheTruthEngine", routeAfterTruthEngine, {
    "TheDispatcher": "TheDispatcher",
    "QuestHalt": "QuestHalt"
});

workflow.addEdge("TheDispatcher", "TheAnalyst");
workflow.addEdge("TheAnalyst", "TheStrategist");
workflow.addEdge("TheStrategist", "TheOracle");
workflow.addEdge("TheOracle", "TheCommunicator");
workflow.addEdge("TheCommunicator", "TheAuditor");
workflow.addEdge("TheAuditor", END);
workflow.addEdge("QuestHalt", END);

export const muhafizGraph = workflow.compile();
