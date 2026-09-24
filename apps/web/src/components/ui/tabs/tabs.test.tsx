import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';

import { TabList, TabPanel, TabRoot, TabTrigger } from './tabs';

afterEach(cleanup);

it('shows the panel of the active tab', () => {
  render(
    <TabRoot defaultValue="Dashboard">
      <TabList aria-label="Pages">
        <TabTrigger value="Dashboard">Dashboard</TabTrigger>
        <TabTrigger value="Budgets">Budgets</TabTrigger>
      </TabList>
      <TabPanel value="Dashboard">Dashboard panel</TabPanel>
      <TabPanel value="Budgets">Budgets panel</TabPanel>
    </TabRoot>
  );

  expect(screen.getByText('Dashboard panel')).toBeTruthy();
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Budgets' }));
  expect(screen.getByText('Budgets panel')).toBeTruthy();
});
