# Muhafiz-X – Agentic Crisis Intelligence Platform

Muhafiz‑X is a next-generation crisis-intelligence platform designed for first-responders, field officers, and citizens. Built with **Google Antigravity** as the orchestrator, it fuses real-time multi-modal signals (social media, weather, traffic, and IoT city sensors) to detect emerging urban crises, predict severity, allocate constrained resources, and simulate coordinated response actions with high-fidelity safety guarantees.

---

## ⚡ Core Concept: Sovereign Digital Pakistan (Tactical Emerald)

Muhafiz-X operates as a **Sovereign Intelligence Layer** designed to safeguard Karachi's public life and economy. The visual interface and mobile applications are styled using the **Digital Crescent** theme: tactical dark mode with vibrant emerald green gradients (`#10b981`) and deep indicator accents, ensuring clarity under crisis pressure.

---

## 🔄 Swarm Agent Roles & Interaction Flow

The Muhafiz-X architecture relies on a specialized 9-Agent Swarm. Each agent is orchestrated via the **Antigravity** framework to ensure synchronous resolution of urban crises.

| Agent | Responsibility | Key Input |
| :--- | :--- | :--- |
| **Sentinel** | Ingests raw signals (social media posts, citizen audio, IoT sensor streams) and performs initial NLP/ASR parsing. Detects crisis type and extracts location. | Roman Urdu audio, text, raw IoT telemetry |
| **Truth-Engine** | Cross‑checks Sentinel outputs against multi‑modal city telemetry (weather, traffic, air quality, satellite fire data) to compute a confidence score. Triggers Verification Quests when confidence < 0.8. | Weather API, Traffic Sensors, NASA FIRMS, City IoT feeds |
| **Oracle** | Runs predictive scenario simulations using historical incident data and real‑time trends to forecast impact, resource needs, and optimal response paths. Produces a success probability and a recommended action plan. | Historical incident database, real‑time sensor trends, Monte‑Carlo simulation |
| **Dispatcher** | Translates Oracle's recommended plan into concrete dispatch orders, selects appropriate units, computes fastest routes via Google Maps, and updates the live routing map. | GPS, unit availability, road network data |
| **Communicator** | Generates bilingual public alerts (English/Urdu) and private briefs. Can enforce silence for proactive maintenance paths. | Crisis priority, language templates |
| **Auditor** | Receives ground‑truth feedback from field officers (True/False alarm, road clear) and updates system state, retracting alerts and freeing resources. | Officer photo/report, status flags |
| **Logistics** | Tracks equipment, supplies, and depot inventories to ensure necessary resources are allocated to dispatched units. | Warehouse API, inventory database |
| **Safety‑Bot** | Enforces regulatory compliance, monitors risk thresholds, and can auto‑escalate to higher authorities if safety limits are breached. | Safety policy engine, compliance rules |
| **Orchestrator** | Central state manager that synchronizes all agent outputs, maintains session context, and drives the Antigravity task planner. | All agent outputs, session store |

**Predictive Modeling (Oracle)**: The Oracle agent leverages a Monte‑Carlo based scenario engine that incorporates live sensor feeds (rainfall intensity, water level, traffic congestion) and historical incident patterns to forecast the likely spread and severity of the emerging event. It then outputs a quantified success probability and a recommended allocation of resources, which the Dispatcher consumes.

**Sensor Integration**: Real‑time city sensors (weather stations, traffic cameras, flood gauges) and external services (NASA FIRMS fire hotspots, Twitter trends) feed directly into the Truth‑Engine and Oracle. This multi‑modal telemetry ensures that the platform reacts to ground truth rather than isolated AI inference, enabling proactive pre‑emptive routing and silent maintenance actions.

### 5. Proactive Maintenance (Silent Preemption Path)
* When sensors detect blockage thresholds (e.g., 85% capacity) along critical corridors like **University Road**, a silent preemption path is activated.
  * **Silence Enforcement:** The Communicator suppresses public alerts, keeping the event hidden from citizens.
  * **Tactical Routing:** The Dispatcher routes specific preventative units (`KWSC_FWO`) to clear the obstruction before rain hits, solving the crisis before it even begins.

---

## 📂 Project Structure & Extensive Documentation

All components are fully documented in the `docs` folder. You can navigate the complete documentation set here:

*   **[docs/PROJECT_README.md](docs/PROJECT_README.md)** – Comprehensive project overview, including the agent interactive flow and cascading mobile app specs.
*   **[docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md)** – Formal JSON schemas detailing the exact payload formats exchanged between the apps, Sentinel, Truth-Engine, and Dispatcher.
*   **[docs/AGENT_ARCHITECTURE.md](docs/AGENT_ARCHITECTURE.md)** – Detailed descriptions of the **9-Agent Swarm**'s roles, active code behaviors, and fallback mechanisms when API quotas are constrained.
*   **[docs/ANTIGRAVITY_USAGE.md](docs/ANTIGRAVITY_USAGE.md)** – Guide on how Antigravity acts as the task orchestrator, schedules background retries, and maintains system-wide state logs.
*   **[docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)** – The official 3–4 minute video script outline mapping standard resolution, false alarms, and predictive preemption flows.
*   **[docs/ANTIGRAVITY_TRACE_SAMPLE.md](docs/ANTIGRAVITY_TRACE_SAMPLE.md)** – An actual simulated JSONL trace showing step-by-step model thoughts, tool calls, and sub-agent state transitions.
*   **[design_guidelines.md](design_guidelines.md)** – The brand identity guidelines implementing the "Sovereign Digital Pakistan" (Tactical Emerald) UI specifications.

---

## 💡 Key Capabilities & Scenarios

### 1. Hierarchical Geolocation Onboarding
To prevent spatial mapping hallucinations in coordinates, the Citizen App implements cascading dropdowns: `Province` → `City` → `District` → `Area` → `Landmark/Chowk`. The "Confirm Location" button remains locked and disabled until all fields are chosen, ensuring high-fidelity coordinate outputs.

### 2. Signal Ingestion Dashboard (Roman Urdu Speech Parsing)
Citizens report crises by holding a "Hold-to-Report" microphone button. On release, the Roman Urdu audio payload is ingested by the **Sentinel Agent** (powered by Gemini API), which parses the vernacular dialect into standardized structured JSON data.

### 3. Verification Quests (Truth-Engine HITL)
If the **Truth-Engine** calculates a confidence score **< 0.8** due to conflicting data sources, it triggers an on-demand **Verification Quest** to the nearest available Field Officer. The Officer's app alerts them with real-world context (e.g., *"Twitter reports fire, but heat sensors show normal"*). Accepting the quest locks the event and displays the fastest dynamic route.

### 4. Ground Truth System Retraction (Auditor Feedback Loop)
If an officer arrives and finds a false positive, tapping **"False Alarm"** or **"Road Clear"** triggers the **Auditor Agent**. The Auditor immediately executes a retraction to the backend, clearing danger zones from the citizen map and recalling queued units.

---

## 🛠️ Installation & Getting Started

### Prerequisites
Ensure you have Node.js (v18+) and npm installed.

### Setup
```bash
# Clone the repository
git clone https://github.com/yourorg/Agent_Muhafiz.git
cd Agent_Muhafiz

# Install project dependencies
npm install
```

### Running Tests & Simulations
Execute the automated test script to run the scenario suite (incorporating standard resolution, false alarms, and predictive preemption flows):
```bash
node run_demo_tests.js
```

---

## 📊 Technical Analysis

### Latency
*   Signal Ingestion → Classification: **~1.5 to 3 seconds**.
*   Resource Allocation → Simulation: **~2 seconds**.
*   Total platform response time is **under 5 seconds**.

### Cost Optimization
*   Using **Gemini 1.5 Flash** for the Sentinel agent keeps processing costs under **$0.001 per signal**.
*   Vertex AI and larger models are reserved for complex Oracle routing, ensuring highly optimized token usage.

### Scalability
The agentic swarm is entirely stateless. Under high load (e.g., city-wide outages), the Sentinel agent scales horizontally. The system degrades gracefully by throttling lower-priority signals and utilizing cached telemetry data if rate limits are hit.
