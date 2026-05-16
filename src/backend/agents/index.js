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
    traceLogs: { value: (prev, curr) => prev.concat(curr), default: () => [] }
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

workflow.addEdge(START, "TheDispatcher");
workflow.addEdge("TheDispatcher", "TheSentinel");
workflow.addEdge("TheSentinel", "TheTruthEngine");
workflow.addEdge("TheTruthEngine", "TheAnalyst");
workflow.addEdge("TheAnalyst", "TheStrategist");
workflow.addEdge("TheStrategist", "TheOracle");
workflow.addEdge("TheOracle", "TheCommunicator");
workflow.addEdge("TheCommunicator", "TheAuditor");
workflow.addEdge("TheAuditor", END);

export const muhafizGraph = workflow.compile();
