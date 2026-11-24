import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const api = 'http://127.0.0.1:18080/api';

async function register(page) {
  const email = `qa-${randomUUID()}@example.test`;
  const password = randomUUID();
  await page.goto('/register');
  await page.locator('input[name="name"]').fill('Synthetic Browser Tester');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole('button', { name: 'Create Free Account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function addMeasurement(page, value, date, unit) {
  await page.getByLabel('Unit', { exact: false }).selectOption(unit);
  await page.getByLabel('Measured value').fill(value);
  await page.getByLabel('Measurement date').fill(date);
  await page.getByLabel('Measurement source').fill('Synthetic comparison fixture');
  await page.getByRole('checkbox', { name: /I checked this transcription/ }).check();
  await page.getByRole('button', { name: 'Add measurement' }).click();
  await expect(page.getByText('User-confirmed transcription', { exact: true })).toBeVisible();
}

test('creates, downloads, edits, compares and deletes private reports', async ({ page }, info) => {
  await register(page);
  await page.getByRole('link', { name: 'Open medical records' }).click();
  await expect(page.getByText(/No records yet/)).toBeVisible();
  await page.getByRole('button', { name: 'Add report', exact: true }).click();
  await page.getByLabel('Report date').fill('2025-10-01');
  await page.getByLabel('Laboratory', { exact: true }).fill('Synthetic First Lab');
  const pdf = Buffer.from('%PDF-1.7\n%%EOF\n');
  await page.getByLabel(/Attachment \(PDF/).setInputFiles({ name: 'synthetic.pdf', mimeType: 'application/pdf', buffer: pdf });
  await page.getByRole('button', { name: 'Create report' }).click();
  await expect(page).toHaveURL(/\/reports\/\d+$/);
  const first = page.url();
  const firstId = first.split('/').at(-1);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download synthetic.pdf' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('synthetic.pdf');
  expect(await readFile(await download.path())).toEqual(pdf);

  await page.getByRole('button', { name: 'Edit report' }).click();
  await page.getByLabel('Notes').fill('Updated synthetic report');
  await page.getByRole('button', { name: 'Save report details' }).click();
  await expect(page.getByText('Updated synthetic report')).toBeVisible();
  await addMeasurement(page, '88.4', '2025-10-01', 'µmol/L');
  await expect(page.getByText(/88.4 µmol\/L/)).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
  await page.screenshot({ path: info.outputPath('report-details.png'), fullPage: true });

  await page.getByRole('navigation', { name: 'Medical records' }).getByRole('link', { name: 'Medical reports' }).click();
  await page.getByRole('button', { name: 'Add report', exact: true }).click();
  await page.getByLabel('Report date').fill('2025-10-02');
  await page.getByLabel('Laboratory', { exact: true }).fill('Synthetic Second Lab');
  await page.getByRole('button', { name: 'Create report' }).click();
  await expect(page).toHaveURL(/\/reports\/\d+$/);
  const secondId = page.url().split('/').at(-1);
  await addMeasurement(page, '1.5', '2025-10-02', 'mg/dL');

  await page.getByRole('navigation', { name: 'Medical records' }).getByRole('link', { name: 'Health trends', exact: true }).click();
  await expect(page.getByRole('img', { name: /Serum creatinine over time/ })).toBeVisible();
  await expect(page.getByText(/1.5 mg\/dL/)).toBeVisible();

  await page.getByRole('link', { name: 'Compare reports', exact: true }).click();
  await page.getByLabel('First report').selectOption(firstId);
  await page.getByLabel('Second report').selectOption(secondId);
  await page.getByRole('button', { name: 'Compare selected reports' }).click();
  await expect(page.getByRole('cell', { name: '0.5 mg/dL' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('report-comparison.png'), fullPage: true });

  await page.goto('/assessment');
  await page.getByRole('button', { name: 'Laboratory-Based Research Assessment' }).click();
  await page.getByRole('button', { name: 'Review saved laboratory values' }).click();
  await expect(page.getByText(/serum creatinine · 1.5 mg\/dL/)).toBeVisible();
  await page.getByRole('button', { name: 'Confirm and copy values' }).click();
  await expect(page.locator('input[name="serumCreatinine"]')).toHaveValue('1.5');

  await page.goto(first);
  await page.getByRole('button', { name: 'Edit measurement' }).click();
  await page.getByLabel('Measured value').fill('176.8');
  await page.getByRole('button', { name: 'Save measurement' }).click();
  await expect(page.getByText(/176.8 µmol\/L/)).toBeVisible();
  await expect(page.getByText('Unconfirmed transcription', { exact: true })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete measurement' }).click();
  await expect(page.getByText('No measurements recorded.')).toBeVisible();
  await page.getByRole('button', { name: 'Delete report', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm delete report' }).click();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(page.getByRole('link', { name: /Synthetic First Lab/ })).toHaveCount(0);
});

test('renders a model-unavailable response without showing a prediction', async ({ page }) => {
  await register(page);
  await page.goto('/assessment');
  await page.getByRole('button', { name: 'Laboratory-Based Research Assessment' }).click();
  await page.route(`${api}/assessments`, async (route) => {
    await route.fulfill({ status: 503, json: { message: 'Risk assessment temporarily unavailable' } });
  });
  await page.getByLabel('Age (Years)').fill('45');
  await page.getByLabel('Diastolic Blood Pressure (mmHg)').fill('80');
  await page.getByRole('button', { name: 'Run research assessment' }).click();
  await expect(page.getByText('The research model is currently unavailable. Try again shortly.')).toBeVisible();
  await expect(page).toHaveURL(/\/assessment$/);
});
