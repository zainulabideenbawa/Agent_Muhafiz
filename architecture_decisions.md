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
**Superseded**: The system now utilizes a "Raw Evidence Gallery" that displays citizen and staff submissions with metadata tracking (source, timestamp) but avoids automated AI inference on the image content itself.

### Consequence
- **Positive:** Dramatic reduction in monthly operational API costs.
- **Negative:** Increased reliance on human "Truth Engine" verification (Field Staff) to confirm validity of citizen reports.
