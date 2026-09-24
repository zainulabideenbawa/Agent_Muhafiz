# Muhafiz-X: Demo Video Script (3-5 Minutes)

**Target Length:** ~4 Minutes
**Visuals:** Screen recording of the Muhafiz-X Citizen App, Field Officer App, and the Antigravity IDE traces showing agentic logic.

---

## 0:00 - 0:30 | Introduction & Challenge Overview
**Voiceover:** 
"Welcome to Muhafiz-X. Cities today face complex, cascading crises. Standard systems wait for disaster to strike, but Muhafiz-X is built for predictive preemption. Using Google Antigravity, we fuse passive sensors with predictive APIs to stop crises before they happen, and coordinate real-time responses when they do."
**Visual:** 
Show the title slide, then quickly transition to a high-level architecture diagram showing the **9-Agent Swarm** (Sentinel, Truth-Engine, Analyst, Strategist, Oracle, etc.).

## 0:30 - 1:15 | Predictive Intelligence & Multi-Source Input
**Voiceover:**
"Let's look at a live scenario. Before a single drop of rain falls, our Analyst Agent detects an anomaly: Mock IoT sensors show sewage lines in G-10 are at 85% capacity. It cross-references this with a Weather API forecasting heavy rain in 6 hours. The system instantly predicts an 90% chance of urban flooding and dispatches a preemptive sanitation crew."
**Visual:**
Show the Antigravity trace fusing sensor data and weather forecast. The map updates to show a yellow 'preemptive action' zone.
**Voiceover:**
"Despite efforts, the rain hits harder than expected. A citizen reports rising water via the Citizen App using our 'Hold-to-Report' voice feature. The Sentinel Agent ingests this new signal."
**Voiceover:**
"Simultaneously, our Social Uplink detects Twitter mentions of congestion in G-10, and a weather API confirms heavy rainfall. The Sentinel Agent ingests these three signals and standardizes the data."
**Visual:**
Show terminal/Antigravity logs ingesting the JSON payload from 3 different sources.

## 1:15 - 2:00 | Detection & Verification (Truth-Engine & Analyst)
**Voiceover:**
"Next, the Truth-Engine Agent steps in. It verifies the signals against live API data. However, a conflicting field report lowers the Confidence Score to 0.75. This triggers an automated 'Verification Quest' to a nearby officer. Simultaneously, the Analyst Agent calculates the affected radius and predicts the flood's spread."
**Visual:**
Show the Antigravity trace highlighting the reasoning step: *Observation: Conflicting signals detected. Truth-Engine Confidence lowered to 0.75. Verification Quest Dispatched.*

## 2:00 - 2:45 | Resource Allocation & Simulation (The Oracle Agent)
**Voiceover:**
"Because we have another ongoing heatwave emergency across town, resources are constrained. The Oracle Agent evaluates the trade-offs. It prioritizes police traffic units for the flood zone to manage congestion, while routing medical outreach to the heatwave."
**Visual:**
Show a map view (dashboard or officer app). Red polygons appear for danger zones. Green safe routes dynamically generate to bypass the flood.

## 2:45 - 3:30 | Coordinated Response (The Communicator & Auditor)
**Voiceover:**
"The Communicator Agent instantly drafts tailored alerts: a public bypass route for citizens, and a technical dispatch brief for Field Officers. But what about the conflicting water-main report? The system dispatches a nearby officer to verify."
**Visual:**
Show the Field Officer App receiving a "Verification Quest".

## 3:30 - 4:15 | False Positive Recovery & Conclusion
**Voiceover:**
"The Field Officer arrives and hits 'False Alarm - Road Clear' on their app. This triggers the Auditor Agent. Antigravity processes this ground truth, instantly retracts the flood alert, updates the public map, and reallocates the police units back to their standard patrol."
**Visual:**
Show the Antigravity trace executing an alert retraction.
**Voiceover:**
"This is Muhafiz-X: Not just a dashboard, but an active, agentic brain for urban resilience. Thank you."
