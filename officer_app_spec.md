# Project Muhafiz-X: Field Officer Mobile App Specification
**Framework:** Flutter
**Target Audience:** First Responders (Rescue 1122, Edhi)

## Screen 1: Mission Dispatch Inbox
*   **Purpose:** Receive AI-generated technical briefs.
*   **UI Components:**
    *   **Inbox List:** Displays cards for active missions. The text must be populated by the **Communicator Agent's** technical dispatches.

## Screen 2: Verification Quests
*   **Purpose:** Human-in-the-loop fallback for low-confidence signals.
*   **UI Components:**
    *   **High-Priority Pop-Up Modal:** Triggered via WebSocket/Push Notification when the backend issues a Verification Quest.
    *   **Action Button -> "Accept Quest":** Updates the database to show the officer is en route.

## Screen 3: Ground Truth Submission Tool
*   **Purpose:** Feed ground reality back into the AI to trigger retractions or actions.
*   **UI Components:**
    *   **Camera Integration:** Button to capture a photo of the scene.
    *   **Status Action Buttons (Crucial):** Three massive buttons: "Confirm Fire", "False Alarm", "Road Clear".
    *   **Logic Wiring:** Pressing "False Alarm" or "Road Clear" MUST NOT be an empty UI interaction. It must trigger an API POST request to the **Auditor Agent**, which will initiate a system-wide "Alert Retraction" in the LangGraph state.