import AxeBuilder from '@axe-core/playwright';

import { expect, seedAccountWithExpense, test } from './fixtures';

const WcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const MainScreens = [
  { heading: 'Home', path: '/' },
  { heading: 'Transactions', path: '/transactions' },
  { heading: 'Review', path: '/review' },
  { heading: 'Import transactions', path: '/import' },
  { heading: 'Analytics', path: '/analytics' },
  { heading: 'Budgets', path: '/budgets' },
  { heading: 'Upcoming', path: '/upcoming' },
  { heading: 'Accounts', path: '/accounts' },
  { heading: 'Settings', path: '/settings' },
  { heading: 'Transaction templates', path: '/settings/templates' },
];

test('the main screens have no detectable WCAG A or AA violations', async ({
  signedInPage: page,
}) => {
  const violationsByScreen: Record<string, string[]> = {};

  await seedAccountWithExpense(page, 'Groceries');

  for (const screen of MainScreens) {
    await page.goto(screen.path);
    await expect(
      page.getByRole('heading', {
        exact: true,
        level: 1,
        name: screen.heading,
      })
    ).toBeVisible();
    await page.waitForFunction(() =>
      document.getAnimations().every(animation => animation.playState !== 'running')
    );

    const { violations } = await new AxeBuilder({ page }).withTags(WcagTags).analyze();

    if (violations.length) {
      violationsByScreen[screen.path] = violations.flatMap(violation =>
        violation.nodes.map(
          node => `${violation.id}: ${node.target.join(' ')} ${node.failureSummary ?? ''}`
        )
      );
    }
  }

  expect(violationsByScreen).toEqual({});
});
