# Agent Architecture

## Overview
Muhafiz‑X consists of a set of **backend AI agents** that work together to detect, verify, and coordinate emergency response. The overall data flow is illustrated in the architecture diagram `assets/architecture_diagram.png`.

## Agents
| Agent | Responsibility | Key Functions |
|-------|----------------|----------------|
| **Sentinel** | First‑line signal ingestion (citizen app or social media) | Detect crisis type, extract precise location, assign urgency, identify secondary hazards. |
| **Truth‑Engine** | Validation against city telemetry and external sources (Twitter, NASA FIRMS) | Compute confidence level, gather verification sources, handle officer‑on‑scene overrides. |
| **Analyst** *(not shown in code base excerpt)* | Enriches classification with risk scores, predicts impact, prepares actionable recommendations. |
| **Oracle** | Runs a virtual rehearsal simulation for the chosen response plan | Generates success probability, simulated logs, and approval flag. |
| **Dispatcher** | Creates a detailed triage and routing directive for the responsible department | Selects department, threat level, specific units, primary route, police block, and coordination for secondary hazards. |
| **Communicator** | Generates bilingual (English/Urdu) public alerts and private briefs | Push notification, WhatsApp draft, mayor brief; suppresses output for `proactive_maintenance`. |
| **Auditor** *(not shown in code base excerpt)* | Accepts ground‑truth submissions from field officers and updates system state. |

## Interaction Flow
1. **Signal** → **Sentinel** → classification.
2. **Classification** → **Truth‑Engine** → confidence verdict.
3. If confidence ≥ 0.8, **Analyst** enriches the state.
4. **Oracle** simulates the plan and returns approval.
5. **Dispatcher** creates a concrete dispatch plan.
6. **Communicator** broadcasts alerts (unless silent).
7. **Auditor** may later provide ground‑truth feedback.

## External Services
- **Google Maps** – Geocoding and routing.
- **Twitter / X** – OSINT verification.
- **NASA FIRMS** – Satellite fire detection.
- **City Sensors** – Real‑time telemetry (rainfall, water level, etc.).
- **KWSC & FWO** – Preventative drainage maintenance.

![Architecture Diagram](assets/architecture_diagram.png)
