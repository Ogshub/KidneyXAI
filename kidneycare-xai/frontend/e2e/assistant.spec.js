import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('answers from reviewed evidence, restores history and deletes a conversation', async ({ page }, info) => {
  const password = randomUUID();
  await page.goto('/register');
  await page.locator('input[name="name"]').fill('Synthetic Assistant Tester');
  await page.locator('input[name="email"]').fill(`assistant-${randomUUID()}@example.test`);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole('button', { name: 'Create Free Account' }).click();
  await expect(page).toHaveURL(/dashboard$/);
  await page.getByRole('link', { name: 'Open assistant' }).click();

  await page.getByRole('button', { name: 'What is eGFR?' }).click();
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('list', { name: 'Evidence sources' })).toBeVisible();

  await page.getByLabel('Ask a question').fill('Show my latest medical report');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('More information needed')).toBeVisible();

  await page.goto('/reports');
  await page.getByLabel('Report date').fill('2025-10-01');
  await page.getByRole('button', { name: 'Create report' }).click();
  await expect(page).toHaveURL(/\/reports\/\d+$/);
  await page.goto('/assistant');
  await page.getByRole('list', { name: 'Saved conversations' }).getByRole('button').first().click();
  await expect(page.getByText('More information needed')).toBeVisible();
  await page.getByLabel('Ask a question').fill('Show my latest medical report');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText(/is dated 2025-10-01/)).toBeVisible();

  await page.getByLabel('Ask a question').fill('What dosage should I take?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Unable to answer', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('assistant.png'), fullPage: true });

  await page.reload();
  await page.getByRole('list', { name: 'Saved conversations' }).getByRole('button').first().click();
  await expect(page.getByText('More information needed')).toBeVisible();
  await page.getByRole('button', { name: 'Delete conversation', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm delete conversation' }).click();
  await expect(page.getByRole('button', { name: 'What is eGFR?' })).toBeVisible();
});
