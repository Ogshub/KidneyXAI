import { expect, test } from '@playwright/test';

test('research analytics distinguishes pending live experiments from computed results', async ({ page }) => {
  await page.goto('/analytics');
  await expect(page.getByRole('heading', { name: 'Phase 5 research studies' })).toBeVisible();
  await expect(page.getByText(/Live M1–M4 comparisons.*pending/)).toBeVisible();
});
