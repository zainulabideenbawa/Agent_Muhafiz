# Crisis Simulation Cost Calculation

**Scenario**: Simulated fire incident at *Gul Plaza*.

## Assumptions
- **Gemini model used**: **Gemini 3.1 Pro** (typical for high‑quality generation).
- **Pricing (per 1 M tokens)** (as of May 2026):
  - Input: **$2.00** per 1 M tokens
  - Output: **$12.00** per 1 M tokens
  - Source: web search result.
- **API Calls** required for a full crisis workflow:
  1. **Crisis Brief Generation** – generate operational briefing.
  2. **Live Routing Update** – request best route from Oracle agent.
  3. **Post‑Crisis Log Submission** – send resolution details to backend.
- **Token Estimates** (rounded):
  | Call | Input Tokens | Output Tokens |
  |------|--------------|---------------|
  | 1 – Brief | 500 | 800 |
  | 2 – Routing | 400 | 600 |
  | 3 – Log | 300 | 500 |
- Total **input tokens**: **1 200**
- Total **output tokens**: **1 900**

## Cost Calculation
- Convert tokens to millions:
  - Input: 1 200 / 1 000 000 = 0.0012 M tokens
  - Output: 1 900 / 1 000 000 = 0.0019 M tokens
- **Input cost**: 0.0012 × $2.00 = **$0.0024**
- **Output cost**: 0.0019 × $12.00 = **$0.0228**
- **Total cost per crisis simulation**: **$0.0252** (≈ 2.5 cents)

## Summary
- **Number of Gemini API calls**: **3**
- **Total tokens processed**: **3 100** (≈ 0.003 M)
- **Estimated monetary cost**: **~$0.03** per simulated fire incident.
- This cost is negligible for a single test, but scaling to thousands of incidents will linearly increase expenditure.

---
*All figures are illustrative; actual token usage may vary depending on prompt complexity and model response length.*
