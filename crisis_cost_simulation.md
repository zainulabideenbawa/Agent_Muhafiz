# Crisis Simulation Cost Analysis & Optimization Strategy

## Overview
This document outlines the actual cost breakdown when resolving a simulated crisis scenario using the Muhafiz-X multi-agent system. It clarifies our cost-saving strategies, token optimization, and architectural decisions that make deploying this system financially practical and scalable for municipal governments.

## The Scenario: Simulated Fire Incident at Gul Plaza
When a crisis occurs, multiple fragmented signals (social media, citizen reports) enter the system. Processing this intelligently requires routing through our 9-agent architecture. However, we have designed the system with **circuit breakers and early interventions** to halt unnecessary LLM calls, significantly reducing operational costs.

## Cost-Saving Interventions (Deterministic APIs)
Before leveraging token-heavy LLMs for reasoning, we rely on free-tier deterministic APIs for hard data verification. This prevents the AI from hallucinating and offloads heavy spatial/environmental calculations:
- **Weather & AQI:** Using free versions of OpenWeatherMap and Air Quality Index (AQI) APIs instead of having the LLM estimate environmental conditions or smoke spread.
- **Traffic & Routing:** Utilizing TomTom's free tier for live traffic speed and route calculation instead of relying on token-heavy spatial reasoning from the LLM.

## Token Breakdown by Agent (9-Agent Architecture)
We use a tiered model strategy. For standard parsing and low-complexity tasks, we use **Gemini 1.5 Flash** (highly cost-effective), and for complex reasoning/simulation, we use **Gemini 3.1 Pro** / **1.5 Pro**.

*Pricing Assumptions (per 1M tokens):*
- **Gemini Flash**: ~$0.075 Input / ~$0.30 Output
- **Gemini Pro**: ~$2.00 Input / ~$12.00 Output

### The 9 Agents & Token Consumption per Full Crisis
| Agent | Role | Model Used | Est. Input Tokens | Est. Output Tokens | Intervention Point (Cost Saving) |
|---|---|---|---|---|---|
| **1. Sentinel** | Parses raw citizen signals/social media to JSON. | Flash | 600 | 150 | Can drop spam/duplicate signals instantly, saving all downstream calls. |
| **2. Truth-Engine** | Cross-references signals with free Weather/TomTom APIs. | Flash | 400 | 100 | **CRITICAL INTERVENTION:** Flags False Alarms. Stops the next 7 API calls! |
| **3. Analyst** | Calculates severity, affected radius, and predictions. | Pro | 800 | 300 | Caches similar recent predictions for identical geofences to save tokens. |
| **4. Strategist** | Allocates finite resources (Rescue 1122, Fire Tenders). | Pro | 500 | 200 | Uses deterministic knapsack algorithm locally before calling LLM. |
| **5. Oracle** | Simulates traffic rerouting and response outcomes. | Pro | 700 | 250 | |
| **6. Communicator** | Drafts customized briefs for officers, citizens, mayor. | Flash | 400 | 300 | |
| **7. Dispatcher** | Assigns specific routes and field units based on Oracle's plan. | Flash | 300 | 100 | |
| **8. Auditor** | Evaluates final execution, handles Human-in-the-Loop updates. | Flash | 500 | 150 | |
| **9. Orchestrator** | Global state supervisor routing tasks to sub-agents. | Pro | 1000 | 400 | |

*Note: If the Truth-Engine detects a false alarm early (e.g., traffic is flowing normally, zero sensor anomalies in a reported "explosion" area), the pipeline terminates at Agent 2, saving 100% of the cost for Agents 3 through 9.*

## Actual Cost Calculation per Crisis Resolution

Assuming a **full 9-agent resolution** (a confirmed, complex crisis with no early termination):

**Gemini Flash (Agents 1, 2, 6, 7, 8):**
- Total Input Tokens: 2,200 tokens
- Total Output Tokens: 800 tokens
- Flash Cost: (2,200 / 1M * $0.075) + (800 / 1M * $0.30) = $0.000165 + $0.00024 = **$0.000405**

**Gemini Pro (Agents 3, 4, 5, 9):**
- Total Input Tokens: 3,000 tokens
- Total Output Tokens: 1,150 tokens
- Pro Cost: (3,000 / 1M * $2.00) + (1,150 / 1M * $12.00) = $0.006 + $0.0138 = **$0.0198**

**Total Summary per Full Crisis Workflow:**
- **Total Gemini API Calls:** 9 calls
- **Total Tokens Processed:** 5,200 Input / 1,950 Output
- **Actual Scenario Cost:** **~$0.0202** (approx. 2 cents per crisis)

## Deployment Practicality & Conclusion
By implementing a tiered multi-agent system with aggressive early-exit interventions (Truth-Engine) and leaning heavily on Gemini Flash for routine parsing, we have brought the compute cost of managing a complex, multi-modal crisis down to **2 cents per event**. Furthermore, leveraging free deterministic APIs (TomTom, OpenWeather) ensures the LLM is only used for high-level reasoning, preventing unnecessary token burn. This architectural discipline makes the Muhafiz-X platform highly scalable and financially practical for continuous real-world municipal deployment.
