import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('keeps the floating assistant across pages, restores history and deletes conversations', async ({ page }, info) => {
  const password = randomUUID();
  await page.goto('/register');
  await page.locator('input[name="name"]').fill('Synthetic Assistant Tester');
  await page.locator('input[name="email"]').fill(`assistant-${randomUUID()}@example.test`);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole('button', { name: 'Create Free Account' }).click();
  await expect(page).toHaveURL(/dashboard$/, { timeout: 15000 });

  const launcher = page.getByRole('button', { name: 'Open KidneyCare AI' });
  const panel = page.getByRole('dialog', { name: 'KidneyCare AI' });
  const question = panel.getByLabel('Ask a question');
  const send = panel.getByRole('button', { name: 'Send message' });
  await expect(panel).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Health workspace' }).getByRole('link', { name: 'Assistant' })).toHaveCount(0);
  await launcher.click();
  await expect(question).toBeFocused();
  await panel.getByRole('button', { name: 'What is eGFR?' }).click();
  await send.click();
  await expect(panel.getByRole('list', { name: 'Evidence sources' })).toBeVisible();

  await question.fill('Show my latest medical report');
  await question.press('Escape');
  await expect(launcher).toBeFocused();
  await page.getByRole('navigation', { name: 'Health workspace' }).getByRole('link', { name: 'Medical Records' }).click();
  await launcher.click();
  await expect(question).toHaveValue('Show my latest medical report');
  await expect(panel.getByRole('list', { name: 'Evidence sources' })).toBeVisible();
  await send.click();
  const conversation = panel.getByRole('log');
  await expect(conversation.locator('article')).toHaveCount(2);

  await panel.getByRole('button', { name: 'Close assistant' }).click();
  await page.getByRole('button', { name: 'Add report', exact: true }).click();
  await page.getByLabel('Report date').fill('2025-10-01');
  await page.getByRole('button', { name: 'Create report' }).click();
  await expect(page).toHaveURL(/\/reports\/\d+$/);
  await page.getByRole('button', { name: 'Explain this report' }).click();
  await expect(question).toHaveValue('Explain this medical report');
  const response = page.waitForRequest((request) => request.url().endsWith('/api/assistant/chat') && request.method() === 'POST');
  await send.click();
  expect((await response).postDataJSON().pageContext).toEqual({
    page: 'report-detail', reportId: Number(page.url().split('/').at(-1)),
  });
  await expect(conversation.locator('article')).toHaveCount(3);
  await page.screenshot({ path: info.outputPath('floating-assistant.png') });

  await page.reload();
  await launcher.click();
  await panel.getByRole('button', { name: 'Conversation history' }).click();
  await panel.getByRole('list', { name: 'Saved conversations' }).getByRole('button').first().click();
  await expect(conversation.locator('article')).toHaveCount(3);
  await panel.getByRole('button', { name: 'Delete conversation', exact: true }).click();
  await panel.getByRole('button', { name: 'Confirm delete conversation' }).click();
  await expect(conversation.locator('article')).toHaveCount(0);
  await panel.getByRole('button', { name: 'Conversation history' }).click();
  await expect(panel.getByText('No saved conversations.')).toBeVisible();
});

test('fits a narrow viewport with visible conversation controls', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.addInitScript(() => {
    localStorage.setItem('kidneycare_token', 'synthetic-browser-fixture');
    localStorage.setItem('kidneycare_user', JSON.stringify({ id: 10, name: 'Synthetic' }));
  });
  await page.route('http://127.0.0.1:18080/api/**', (route) => route.fulfill({ json: route.request().url().endsWith('/reports?page=0')
    ? { content: [], totalElements: 0 } : route.request().url().endsWith('/dashboard') ? { recordedDaysLast7: 0 } : [] }));
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Open KidneyCare AI' }).click();
  const panel = page.getByRole('dialog', { name: 'KidneyCare AI' });
  await expect(panel.getByLabel('Ask a question')).toBeInViewport();
  await expect(panel.getByRole('button', { name: 'Send message' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await panel.getByLabel('Ask a question').press('Escape');
  await expect(page.getByRole('button', { name: 'Open KidneyCare AI' })).toBeFocused();
});
