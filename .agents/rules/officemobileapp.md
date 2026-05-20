---
trigger: always_on
---

Project Muhafiz-X: Field Officer Mobile App Specification
**Framework:** Flutter
**Target Audience:** First Responders & Field Officers (Rescue 1122, Edhi)

## Core Architecture & State Wiring
This app is a military-grade tasking terminal. It provides the Human-in-the-Loop (HITL) fallback for the AI. Every action must be wired to mock async functions that represent state updates in our LangGraph backend.

## Screen 1: Mission Dispatch Inbox (The Communicator View)
*   **Purpose:** Receive highly technical, AI-generated operational briefings.
*   **UI Components:**
    *   **Dispatch Feed:** A list of active mission cards. The text must be populated by the **Communicator Agent** (e.g., detailing exactly what equipment is needed and the Analyst's severity score).
    *   **Live Routing Map:** A map view showing the fastest route to the crisis, updating dynamically if the Oracle agent simulates a better path.

## Screen 2: Verification Quests (The Truth-Engine View)
*   **Purpose:** Investigate signals that the AI could not fully verify.
*   **UI Components:**
    *   **High-Priority Alert Modal:** This must pop up when the backend triggers a quest because the Truth-Engine calculated a Confidence Score of < 0.8.
    *   **Data Context:** Displays why the AI is unsure (e.g., "Social media reports fire, but heat sensors show normal temperatures").
    *   **Action Button -> "Accept Quest":** Updates the database to show the officer is en route to investigate.

## Screen 3: Ground Truth Submission Tool (The Auditor View)
*   **Purpose:** Feed ground reality back into the AI to trigger retractions or resource allocations.
*   **UI Components:**
    *   **Camera Integration:** Button to capture a photo of the scene for the system's permanent log.
    *   **Status Action Buttons (Crucial):** Three massive, high-contrast buttons: "Confirm Crisis", "False Alarm", and "Road Clear".
    *   **Logic Wiring:** Pressing "False Alarm" or "Road Clear" MUST NOT be an empty UI interaction. It must trigger a POST request to the **Auditor Agent**, which will initiate a system-wide "Alert Retraction" in the LangGraph state to recall dispatched units.
