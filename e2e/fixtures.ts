import { test as base, expect, type Page } from '@playwright/test';

import { localIsoDate } from '@coinkeeper/shared/lib/date-helpers';

export const AppOrigin = 'http://localhost:3000';
export const Password = 'an end to end password';

const TestUserName = 'End To End';

type Fixtures = {
  signedInPage: Page;
};

export const uniqueEmail = () => `e2e-${crypto.randomUUID()}@example.com`;

export const apiPost = async <Result = { id: string }>(
  page: Page,
  path: string,
  body: unknown
): Promise<Result> => {
  const response = await page.request.post(`/api/v1${path}`, {
    data: body,
    headers: { origin: AppOrigin },
  });

  expect(response.ok(), await response.text()).toBe(true);

  return response.json() as Promise<Result>;
};

export const signUpThroughForm = async (page: Page, email: string) => {
  await page.goto('/sign-up');
  await page.getByLabel('Name').fill(TestUserName);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(Password);
  await page.getByLabel('Repeat the password').fill(Password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { exact: true, name: 'Home' })).toBeVisible();
};

export const seedAccountWithExpense = async (page: Page, memo: string) => {
  const account = await apiPost(page, '/accounts', {
    currency: 'EUR',
    name: 'Everyday',
    openingBalance: '100',
    type: 'checking',
  });

  await apiPost(page, '/transactions', {
    accountId: account.id,
    amount: '12.50',
    date: localIsoDate(new Date()),
    direction: 'expense',
    memo,
  });

  return account;
};

export const test = base.extend<Fixtures>({
  signedInPage: async ({ page }, runTest) => {
    await apiPost(page, '/auth/sign-up', {
      email: uniqueEmail(),
      name: TestUserName,
      password: Password,
    });
    await runTest(page);
  },
});

export { expect };
