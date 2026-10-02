import { expect, seedAccountWithExpense, test } from './fixtures';

const ReportOnlyHeader = 'content-security-policy-report-only';
const EnforcedHeader = 'content-security-policy';
const ViolationMarker = 'Content Security Policy';

const ScreenPaths = [
  '/',
  '/transactions',
  '/analytics',
  '/budgets',
  '/upcoming',
  '/accounts',
  '/settings',
  '/settings/templates',
];

test('pages send the enforced frame policy and the report-only policy', async ({ page }) => {
  const response = await page.goto('/sign-in');
  const headers = response!.headers();

  expect(headers[EnforcedHeader]).toBe("frame-ancestors 'none'");
  expect(headers[ReportOnlyHeader]).toContain("default-src 'self'");
  expect(headers[ReportOnlyHeader]).toContain("object-src 'none'");
});

test('the main screens raise no report-only policy violations', async ({ signedInPage: page }) => {
  const violations: string[] = [];

  page.on('console', message => {
    if (message.text().includes(ViolationMarker)) violations.push(message.text());
  });
  await seedAccountWithExpense(page, 'Rent');

  for (const path of ScreenPaths) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  expect(violations).toEqual([]);
});
