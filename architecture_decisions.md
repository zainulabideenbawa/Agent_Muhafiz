# Muhafiz-X Architecture Decision Records (ADR)

## ADR 001: Removal of Real-time AI Image Analysis

### Context
In the Sovereign Urban Governance platform, visual evidence (photos from citizens and field staff) is critical for situating a crisis. Initially, an AI-driven "Truth Engine" was proposed to perform real-time computer vision analysis on every uploaded image to verify combustion signatures (fire) or water saturation levels (floods).

### Decision
We have decided to **remove** the real-time AI image analysis block from the active Tactical Feed.

### Rationale
1. **API Cost Optimization:** Multi-modal AI analysis (processing high-resolution images) carries a significantly higher token cost compared to text-based reasoning. In a high-frequency urban crisis (e.g., hundreds of citizen uploads during a flood), the operational expenditure of the Gemini API would escalate beyond sustainable government budgets.
2. **Operational Efficiency:** Relying on automated AI analysis for every pixel can introduce latency in the "OODA Loop" (Observe, Orient, Decide, Act). By focusing on **raw evidence display**, we allow human commanders and the Sovereign Dispatcher to prioritize human-verified staff photos over unverified citizen uploads without incurring high per-image compute costs.
3. **Privacy and Compliance:** Automated scanning of citizen-provided photos raises data sovereignty and privacy concerns. Keeping the images as raw attachments for manual human review is a more conservative and legally sound starting point for a public sector OS.

### Status
**Superseded**: The system now utilizes a "Raw Evidence Gallery" for visuals, while text-based OSINT is processed via a live uplink.

## ADR 002: Integration of Apify for Live OSINT Ingestion

### Context
Government agencies often lack real-time access to the "Digital Pulse" of the city. Waiting for citizens to download a formal app creates a delay in response times.

### Decision
We have implemented a **Social Uplink Bridge** using the Apify API to ingest live Twitter/X and Facebook data.

### Rationale
1. **Low-Latency Proactivity:** By scraping mentions of official handles and crisis-related hashtags, Muhafiz-X can identify emergencies 5-10 minutes before a formal report is filed.
2. **Cost-Effective Prototyping:** Apify's free tier allows for a high-fidelity "Live Simulation" without expensive Enterprise API contracts with social platforms.
3. **Agentic Pre-Processing:** Raw social data is passed to **The Sentinel** agent, which acts as an intelligence filter to ensure the Dispatcher only acts on verified, high-urgency reports.

### Status
**Active**: The `social_uplink.js` bridge is operational as a Phase 2 intelligence layer.

