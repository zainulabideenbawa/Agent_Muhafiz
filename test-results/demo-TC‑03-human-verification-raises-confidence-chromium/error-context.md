# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo.spec.js >> TC‑03 human verification raises confidence
- Location: tests/demo.spec.js:45:1

# Error details

```
Error: weather mock failed 401
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e5]:
    - img [ref=e7]
    - heading "Sovereign Gateway" [level=1] [ref=e9]
    - paragraph [ref=e10]: Identity Verification Required
    - generic [ref=e11]:
      - generic [ref=e12]:
        - text: Command Identity (Email)
        - textbox "commander@muhafiz.gov" [ref=e13]
      - generic [ref=e14]:
        - text: Access Protocol (Password)
        - textbox "••••••••" [ref=e15]
    - button "Commit Authentication" [ref=e16]:
      - text: Commit Authentication
      - img [ref=e17]
    - paragraph [ref=e19]: Muhafiz-X // Security Level 5
  - generic [ref=e20]:
    - generic [ref=e21]: RSA_4096_ENCRYPTION_ACTIVE
    - generic [ref=e23]: KARACHI_GRID_SECURED
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Helper to post mock data
  4  | async function postTool(name, payload) {
  5  |   const resp = await fetch(`http://127.0.0.1:3001/api/tools/${name}`, {
  6  |     method: 'POST',
  7  |     headers: { 'Content-Type': 'application/json' },
  8  |     body: JSON.stringify(payload),
  9  |   });
> 10 |   if (!resp.ok) throw new Error(`${name} mock failed ${resp.status}`);
     |                       ^ Error: weather mock failed 401
  11 | }
  12 | 
  13 | // We assume the server (Vite + Express backend) is already started by run_demo_tests.js
  14 | 
  15 | // ------------------- TC‑01 Normal Agent -------------------
  16 | test('TC‑01 normal agent resolution', async ({ page }) => {
  17 |   await page.goto('/');
  18 |   await postTool('weather', { region: 'G-10', alert: true, confidence: 0.94 });
  19 |   await postTool('traffic', { region: 'G-10', congestion: 45 });
  20 |   await postTool('signal', { type: 'social', text: 'Flash flood in G-10, cars stuck' });
  21 |   const modal = page.locator('text=AI Trust Rating');
  22 |   await expect(modal).toBeVisible({ timeout: 8000 });
  23 |   const pct = await page.locator('svg >> text').first().innerText();
  24 |   expect(parseInt(pct)).toBeGreaterThanOrEqual(80);
  25 |   const ackBtn = page.getByRole('button', { name: /Acknowledge/i });
  26 |   await expect(ackBtn).toBeEnabled();
  27 |   await ackBtn.click();
  28 |   await expect(modal).toBeHidden();
  29 |   await expect(page.locator('.green-route')).toBeVisible();
  30 | });
  31 | 
  32 | // ------------------- TC‑02 Fallback -------------------
  33 | test('TC‑02 fallback when weather API times out', async ({ page }) => {
  34 |   await page.goto('/');
  35 |   await postTool('weather', { error: true, status: 504 });
  36 |   await postTool('traffic', { region: 'G-10', congestion: 12 });
  37 |   await postTool('signal', { type: 'social', text: 'Flash flood in G-10' });
  38 |   const banner = page.locator('text=⚠️ Insufficient data – human review required');
  39 |   await expect(banner).toBeVisible({ timeout: 8000 });
  40 |   const ackBtn = page.getByRole('button', { name: /Acknowledge/i });
  41 |   await expect(ackBtn).toBeDisabled();
  42 | });
  43 | 
  44 | // ------------------- TC‑03 Human Verification -------------------
  45 | test('TC‑03 human verification raises confidence', async ({ page }) => {
  46 |   await page.goto('/');
  47 |   await postTool('weather', { error: true, status: 504 });
  48 |   await postTool('signal', { type: 'social', text: 'Flash flood in G-10' });
  49 |   const verifyBtn = page.getByRole('button', { name: /Request Verification/i });
  50 |   await expect(verifyBtn).toBeVisible();
  51 |   await verifyBtn.click();
  52 |   const slider = page.locator('#humanConfidence');
  53 |   await slider.fill('78');
  54 |   await page.getByRole('button', { name: /Confirm Threat/i }).click();
  55 |   const modal = page.locator('text=AI Trust Rating');
  56 |   await expect(modal).toBeVisible();
  57 |   const pct = await page.locator('svg >> text').first().innerText();
  58 |   expect(parseInt(pct)).toBeCloseTo(78, 2);
  59 | });
  60 | 
  61 | // ------------------- TC‑04 False Alarm -------------------
  62 | test('TC‑04 false alarm retraction', async ({ page }) => {
  63 |   await page.goto('/');
  64 |   await postTool('weather', { alert: false });
  65 |   await postTool('signal', { type: 'social', text: 'Water main burst in G-10, not flood' });
  66 |   const modal = page.locator('text=AI Trust Rating');
  67 |   await expect(modal).toBeVisible();
  68 |   const pct = await page.locator('svg >> text').first().innerText();
  69 |   expect(parseInt(pct)).toBeLessThan(60);
  70 |   await page.getByRole('button', { name: /Acknowledge/i }).click();
  71 |   await postTool('sensor', { type: 'water_main', status: 'burst', location: 'G-10' });
  72 |   const retract = page.locator('text=⚡ False alarm – water‑main issue resolved');
  73 |   await expect(retract).toBeVisible({ timeout: 8000 });
  74 |   await expect(page.locator('.danger-zone')).toBeHidden();
  75 | });
  76 | 
  77 | // ------------------- TC‑05 Predictive Alert -------------------
  78 | test('TC‑05 predictive alert from forecast', async ({ page }) => {
  79 |   await page.goto('/');
  80 |   await postTool('forecast', { region: 'G-10', rainProb: 0.88 });
  81 |   await page.waitForTimeout(2000);
  82 |   const predAlert = page.locator('text=Predictive Alert – Flood Risk');
  83 |   await expect(predAlert).toBeVisible();
  84 |   const pct = await page.locator('svg >> text').first().innerText();
  85 |   expect(parseInt(pct)).toBeCloseTo(88, 2);
  86 |   const prepBtn = page.getByRole('button', { name: /Prepare Resources/i });
  87 |   await expect(prepBtn).toBeEnabled();
  88 |   await prepBtn.click();
  89 |   const ticket = page.locator('text=Planned – Flood in G‑10');
  90 |   await expect(ticket).toBeVisible();
  91 | });
  92 | 
```