import { demoCredentials } from '../apps/api/src/demo/credentials';
import { expect, test } from './fixtures';

test('signs in to the seeded demo account and shows its history', async ({ page }) => {
  const credentials = demoCredentials(process.env);

  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
  await expect(page.getByText('2 transactions need a category.')).toBeVisible();
  await expect(page.getByText('USD account').first()).toBeVisible();
  await expect(page.getByText('Everyday account').first()).toBeVisible();
});
