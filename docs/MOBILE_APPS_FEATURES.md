# Mobile Applications (Citizen & Field Officer)

The Muhafiz-X platform bridges the gap between the AI backend and the physical world using two specialized Flutter-based mobile applications. Every UI interaction is strictly wired to the 9-Agent backend architecture.

---

## 1. Muhafiz-X: Citizen App
**Target Audience:** General Public

### Screen 1: Hierarchical Geolocation Onboarding
- **Purpose:** Locks down exact user coordinates for the Analyst Agent to prevent mapping hallucinations.
- **UI & Logic:** Users sequentially select: Province -> City -> District -> Area -> Specific Landmark (Chowk). The "Confirm Location" button remains disabled until all fields are filled, ensuring high-fidelity spatial data for the system.

### Screen 2: Signal Ingestion Dashboard
- **Purpose:** Rapid, multi-modal crisis reporting.
- **UI & Logic:** Features a giant "Hold-to-Report" microphone button. Releasing the button sends the raw audio payload to the **Sentinel Agent** (via Gemini 1.5 Flash). The Sentinel parses the Roman Urdu/English speech into a standardized JSON `Potential Event`. A dynamic status banner displays "Analyzing Signal..." followed by "Report Logged".

### Screen 3: Dynamic Safe Routes Map
- **Purpose:** Helps citizens bypass AI-confirmed crises.
- **UI & Logic:** Renders the user's location via Mapbox/Google Maps. The system plots red danger polygons based on the `affected_radius` calculated by the **Analyst Agent**. Simultaneously, the **Oracle Agent** calculates and renders dynamic green safe route polylines that explicitly bypass the danger zones.

---

## 2. Muhafiz-X: Field Officer App
**Target Audience:** First Responders (Rescue 1122, Police, Edhi)
**Role:** A military-grade tasking terminal serving as the absolute Human-in-the-Loop (HITL) fallback.

### Screen 1: Mission Dispatch Inbox (The Communicator View)
- **Purpose:** Receive highly technical, AI-generated operational briefings.
- **UI & Logic:** A feed of active mission cards. Text is exclusively drafted by the **Communicator Agent**, detailing necessary equipment and the Analyst’s severity score. Features a Live Routing Map managed by the **Dispatcher Agent** for the fastest route.

### Screen 2: Verification Quests (The Truth-Engine View)
- **Purpose:** Investigate ambiguous signals the AI could not fully verify programmatically.
- **UI & Logic:** A High-Priority Alert Modal triggers if the **Truth-Engine Agent** calculates a Confidence Score < 0.8. It displays context (e.g., "Social reports fire, but heat sensors read normal"). Clicking "Accept Quest" updates the global state, indicating the officer is en route to investigate.

### Screen 3: Ground Truth Submission Tool (The Auditor View)
- **Purpose:** Feed definitive ground reality back into the AI to trigger systemic retractions or escalations.
- **UI & Logic:** Features camera integration to log the scene. Contains three massive, high-contrast action buttons: **"Confirm Crisis"**, **"False Alarm"**, and **"Road Clear"**.
- **Critical Wiring:** Pressing "False Alarm" or "Road Clear" sends a direct POST request to the **Auditor Agent**. The Auditor immediately executes an "Alert Retraction" across the entire LangGraph/Antigravity state, halting further dispatches and clearing the citizen map.
