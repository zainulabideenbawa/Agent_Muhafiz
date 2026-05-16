# Project Muhafiz-X: Citizen Mobile App Specification
**Framework:** Flutter
**Target Audience:** General Public

## Screen 1: Hierarchical Geolocation Onboarding
*   **Purpose:** Lock down exact user coordinates for the Analyst Agent.
*   **UI Components:**
    *   **Cascading Dropdowns:** User must sequentially select: Province -> City -> District -> Area -> Specific Landmark (Chowk). 
    *   **Action Button -> "Confirm Location":** This button remains disabled until all fields are filled. Clicking it saves the exact geospatial node to the user's session state.

## Screen 2: Signal Ingestion Dashboard
*   **Purpose:** Rapid, multi-modal crisis reporting.
*   **UI Components:**
    *   **Giant "Hold-to-Report" Mic Button:** Centered on the screen. Must hook into the device microphone. 
    *   **Logic Wiring:** Releasing the button must send the audio payload to the **Sentinel Agent** (via Gemini 1.5 Flash API) to parse the Roman Urdu into a standardized JSON `Potential Event` object.
    *   **Status Banner:** Displays "Analyzing Signal..." while the backend processes, changing to "Report Logged" upon success.

## Screen 3: Dynamic Safe Routes Map
*   **Purpose:** Help citizens bypass AI-confirmed crises.
*   **UI Components:**
    *   **Interactive Map (Mapbox/Google Maps):** Renders the user's location.
    *   **Danger Zones:** Plots red polygons based on the `affected_radius` calculated by the **Analyst Agent**.
    *   **Safe Route Polyline:** Renders dynamic green routes that explicitly bypass the red polygons.