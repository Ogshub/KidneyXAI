import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

async function syntheticAccount(page) {
  const credentials = { email: `auth-${randomUUID()}@example.test`, password: `Auth!${randomUUID()}` };
  await page.goto('/register');
  await page.locator('input[name="name"]').fill('Synthetic Session Tester');
  await page.locator('input[name="email"]').fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.locator('input[name="confirmPassword"]').fill(credentials.password);
  await page.getByRole('button', { name: 'Create Free Account' }).click();
  await expect(page).toHaveURL(/dashboard$/, { timeout: 15000 });
  return credentials;
}

test('a stale bearer token is rejected and the browser can sign in again', async ({ page }) => {
  test.setTimeout(60000);
  const initialDashboard = page.waitForResponse((response) => response.url().endsWith('/api/dashboard'));
  const credentials = await syntheticAccount(page);
  expect((await initialDashboard).status()).toBe(200);
  await page.evaluate(() => {
    const [head, payload, signature] = localStorage.getItem('kidneycare_token').split('.');
    localStorage.setItem('kidneycare_token', [head, payload, (signature[0] === 'A' ? 'B' : 'A') + signature.slice(1)].join('.'));
  });
  const rejected = page.waitForResponse((response) => response.url().endsWith('/api/dashboard') && response.status() >= 400);
  await page.reload();
  expect((await rejected).status()).toBe(401);
  await expect(page.getByText('Your session expired. Please sign in again.')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('kidneycare_token') === null)).toBe(true);
  await page.locator('input[name="email"]').fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign In to Portal' }).click();
  await expect(page).toHaveURL(/dashboard$/, { timeout: 15000 });
  const requests = await page.evaluate(async () => {
    const Authorization = 'Bearer ' + localStorage.getItem('kidneycare_token');
    const api = 'http://127.0.0.1:18080/api';
    const post = (path, body) => fetch(api + path, { method: 'POST',
      headers: { Authorization, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const dashboard = await fetch(api + '/dashboard', { headers: { Authorization } });
    const assessment = await post('/assessments', { age: 42, bloodPressure: 80 });
    const assistant = await post('/assistant/chat', { message: 'What is eGFR?' });
    return [dashboard.status, assessment.status, assistant.status, (await assistant.json()).decision];
  });
  expect(requests).toEqual([200, 201, 200, 'ANSWER']);
});
