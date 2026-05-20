# Muhafiz-X Hackathon Project

## Introduction
Muhafiz‑X is an agentic crisis‑intelligence platform designed for first‑responders and field officers. It fuses real‑time signals (social media, weather, traffic, sensors) to detect emerging urban crises, predict severity, allocate constrained resources, and simulate coordinated response actions. The solution is built with **Google Antigravity** as the core orchestrator.

## Challenge Overview
- **Goal:** Detect, prioritize, and mitigate urban crises such as flooding, heatwaves, accidents, infrastructure failures, and disease spikes.
- **Requirements:** Mobile app (mandatory), multi‑signal fusion (>=3 sources), confidence scoring, resource allocation, simulation, false‑alarm handling, and robust Antigravity trace logging.

## Architecture
See [AGENT_ARCHITECTURE.md](AGENT_ARCHITECTURE.md) for a detailed description of each agent (Communicator, Analyst, Oracle, Auditor, Sentinel, etc.) and the data flow.

## Quick‑Start
```bash
# Clone the repository
git clone https://github.com/yourorg/Agent_Muhafiz.git
cd Agent_Muhafiz

# Install dependencies
npm install

# Run the mobile app (Flutter) – instructions in the mobile app README.
```

## Demo Video
A 3‑5 minute demo showcases the end‑to‑end workflow: signal ingestion → crisis detection → severity prediction → resource allocation → simulation → recovery. The script is in [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

## Antigravity Trace Submission
All Antigravity agent traces, reasoning steps, and tool calls are documented in [ANTIGRAVITY_TRACE_SAMPLE.md](ANTIGRAVITY_TRACE_SAMPLE.md) and submitted as part of the final deliverables.

## Frequently Asked Questions
See [FAQs.md](FAQs.md) for all hackathon FAQs.

## License
This project is open‑source under the Apache 2.0 License.
