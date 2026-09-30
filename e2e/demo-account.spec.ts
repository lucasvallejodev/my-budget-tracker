import { demoCredentials } from '../apps/api/src/demo/credentials';
import { expect, test } from './fixtures';

test('signs in to the seeded demo account and shows its history', async ({ page }) => {
  const credentials = demoCredentials(process.env);

  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { exact: true, name: 'Home' })).toBeVisible();
  await expect(page.getByRole('link', { name: '2 transactions need a category' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'USD' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent activity' })).toBeVisible();

  await page.goto('/budgets');
  await expect(page.getByText(/Left to spend in/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Category budgets' })).toBeVisible();

  await page.goto('/analytics/payees');
  await expect(page.getByRole('heading', { name: 'Top payees' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Oakwood Lettings' })).toBeVisible();
});
