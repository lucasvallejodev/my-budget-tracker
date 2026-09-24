import { expect, type Page, test } from '@playwright/test';

const Password = 'an end to end password';

const uniqueEmail = () => `e2e-${crypto.randomUUID()}@example.com`;

const signUp = async (page: Page, email: string) => {
  await page.goto('/sign-up');
  await page.getByLabel('Name').fill('End To End');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(Password);
  await page.getByLabel('Repeat the password').fill(Password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
};

const apiPost = async (page: Page, path: string, body: unknown) => {
  const response = await page.request.post(`/api/v1${path}`, { data: body });

  expect(response.ok(), await response.text()).toBe(true);

  return response.json() as Promise<{ id: string }>;
};

test('redirects signed-out visitors to sign-in and back after signing in', async ({ page }) => {
  const email = uniqueEmail();

  await signUp(page, email);
  await page.getByRole('button', { name: 'Account menu' }).last().click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.goto('/budgets');
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fbudgets$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(Password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/budgets$/);
});

test('deletes a transaction, keeps it out of the list and restores it', async ({ page }) => {
  await signUp(page, uniqueEmail());

  const account = await apiPost(page, '/accounts', {
    currency: 'EUR',
    name: 'Everyday',
    openingBalance: '100',
    type: 'checking',
  });

  await apiPost(page, '/transactions', {
    accountId: account.id,
    amount: '12.50',
    date: new Date().toISOString().slice(0, 10),
    direction: 'expense',
    memo: 'Coffee beans',
  });

  await page.goto('/transactions');
  await page.getByRole('button', { name: 'Actions for Coffee beans' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Transaction deleted')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Actions for Coffee beans' })).toHaveCount(0);

  await page.goto('/settings/deleted');
  await page.getByRole('button', { name: 'Restore Coffee beans' }).click();
  await expect(page.getByText('Restored')).toBeVisible();

  await page.goto('/transactions');
  await expect(page.getByRole('button', { name: 'Actions for Coffee beans' })).toBeVisible();
});

test('refuses a write from another origin', async ({ page }) => {
  await signUp(page, uniqueEmail());

  const response = await page.request.post('/api/v1/accounts', {
    data: {
      currency: 'EUR',
      name: 'Forged',
      type: 'cash',
    },
    headers: { origin: 'https://evil.example' },
  });

  expect(response.status()).toBe(403);
});
