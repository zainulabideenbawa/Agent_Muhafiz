import { test, expect } from '@playwright/test';

// Helper to post mock data
async function postTool(name, payload) {
  const resp = await fetch(`http://127.0.0.1:3001/api/tools/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`${name} mock failed ${resp.status}`);
}

// We assume the server (Vite + Express backend) is already started by run_demo_tests.js

// ------------------- TC‑01 Normal Agent -------------------
test('TC‑01 normal agent resolution', async ({ page }) => {
  await page.goto('/');
  await postTool('weather', { region: 'G-10', alert: true, confidence: 0.94 });
  await postTool('traffic', { region: 'G-10', congestion: 45 });
  await postTool('signal', { type: 'social', text: 'Flash flood in G-10, cars stuck' });
  const modal = page.locator('text=AI Trust Rating');
  await expect(modal).toBeVisible({ timeout: 8000 });
  const pct = await page.locator('svg >> text').first().innerText();
  expect(parseInt(pct)).toBeGreaterThanOrEqual(80);
  const ackBtn = page.getByRole('button', { name: /Acknowledge/i });
  await expect(ackBtn).toBeEnabled();
  await ackBtn.click();
  await expect(modal).toBeHidden();
  await expect(page.locator('.green-route')).toBeVisible();
});

// ------------------- TC‑02 Fallback -------------------
test('TC‑02 fallback when weather API times out', async ({ page }) => {
  await page.goto('/');
  await postTool('weather', { error: true, status: 504 });
  await postTool('traffic', { region: 'G-10', congestion: 12 });
  await postTool('signal', { type: 'social', text: 'Flash flood in G-10' });
  const banner = page.locator('text=⚠️ Insufficient data – human review required');
  await expect(banner).toBeVisible({ timeout: 8000 });
  const ackBtn = page.getByRole('button', { name: /Acknowledge/i });
  await expect(ackBtn).toBeDisabled();
});

// ------------------- TC‑03 Human Verification -------------------
test('TC‑03 human verification raises confidence', async ({ page }) => {
  await page.goto('/');
  await postTool('weather', { error: true, status: 504 });
  await postTool('signal', { type: 'social', text: 'Flash flood in G-10' });
  const verifyBtn = page.getByRole('button', { name: /Request Verification/i });
  await expect(verifyBtn).toBeVisible();
  await verifyBtn.click();
  const slider = page.locator('#humanConfidence');
  await slider.fill('78');
  await page.getByRole('button', { name: /Confirm Threat/i }).click();
  const modal = page.locator('text=AI Trust Rating');
  await expect(modal).toBeVisible();
  const pct = await page.locator('svg >> text').first().innerText();
  expect(parseInt(pct)).toBeCloseTo(78, 2);
});

// ------------------- TC‑04 False Alarm -------------------
test('TC‑04 false alarm retraction', async ({ page }) => {
  await page.goto('/');
  await postTool('weather', { alert: false });
  await postTool('signal', { type: 'social', text: 'Water main burst in G-10, not flood' });
  const modal = page.locator('text=AI Trust Rating');
  await expect(modal).toBeVisible();
  const pct = await page.locator('svg >> text').first().innerText();
  expect(parseInt(pct)).toBeLessThan(60);
  await page.getByRole('button', { name: /Acknowledge/i }).click();
  await postTool('sensor', { type: 'water_main', status: 'burst', location: 'G-10' });
  const retract = page.locator('text=⚡ False alarm – water‑main issue resolved');
  await expect(retract).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.danger-zone')).toBeHidden();
});

// ------------------- TC‑05 Predictive Alert -------------------
test('TC‑05 predictive alert from forecast', async ({ page }) => {
  await page.goto('/');
  await postTool('forecast', { region: 'G-10', rainProb: 0.88 });
  await page.waitForTimeout(2000);
  const predAlert = page.locator('text=Predictive Alert – Flood Risk');
  await expect(predAlert).toBeVisible();
  const pct = await page.locator('svg >> text').first().innerText();
  expect(parseInt(pct)).toBeCloseTo(88, 2);
  const prepBtn = page.getByRole('button', { name: /Prepare Resources/i });
  await expect(prepBtn).toBeEnabled();
  await prepBtn.click();
  const ticket = page.locator('text=Planned – Flood in G‑10');
  await expect(ticket).toBeVisible();
});
