'use client';

import './settings-panels.scss';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Cluster,
  Field,
  Grid,
  Input,
  ListRow,
  Notice,
  Panel,
  PillSelect,
  SettingsSection,
  Stack,
  Text,
  ToggleSwitch,
} from '@/components/ui';
import { applyTheme } from '@/lib/appearance';

import { exportTransactions } from '../export-transactions';
import { SampleTransactions } from '../sample-data';
import { TransactionRow } from '../use-finance-data';

const AppearancePlaceholder = 'Choose appearance';
const PersonalFields = ['First name', 'Last name', 'Email', 'Phone', 'Address'];
const SampleSessions = ['Chrome on Windows', 'Safari on iPhone', 'Firefox on MacBook'];
const DeliveryChannels = ['Email Only', 'Push Notifications Only', 'Both Email and Push'];

const NotificationPreferences = [
  ['Transaction Alerts', 'Get notified for transactions on your account'],
  ['Budget Limit Alerts', 'Alerts when approaching your budget limits'],
  ['Monthly Summary Email', 'A monthly overview of income and spending'],
  ['Security Alerts', 'Important account security notifications'],
];

const SupportTopics = [
  [
    'Help Center',
    'Create an account first, then record income and expenses from the dashboard. Use Transactions to search and export your records.',
  ],
  ['Privacy Policy', 'The project has not published a privacy policy yet.'],
  ['Terms & Conditions', 'The project has not published terms of service yet.'],
  ['Contact Support', 'A support contact has not been configured for this project.'],
];

function Choice({
  label,
  onChange,
  options,
}: {
  label: string;
  onChange?: (value: string) => void;
  options: string[];
}) {
  return (
    <Field>
      {label}
      <PillSelect onChange={event => onChange?.(event.target.value)}>
        {options.map(option => (
          <option key={option}>{option}</option>
        ))}
      </PillSelect>
    </Field>
  );
}

export function ProfileSettings({ demo, onManage }: { demo: boolean; onManage: () => void }) {
  return (
    <Panel title="Profile Information">
      <SettingsSection title="Profile Photo" description="Basic profile information">
        <Cluster>
          <span className="settings-panels__avatar">AM</span>
          <Button variant="outline" onClick={onManage}>
            {demo ? 'Preview photo control' : 'Manage profile photo'}
          </Button>
        </Cluster>
      </SettingsSection>
      {demo ? (
        <>
          <SettingsSection
            title="Personal Information"
            description="Update your personal information"
          >
            <Grid>
              {PersonalFields.map(label => (
                <Field key={label}>
                  {label}
                  <Input type={label === 'Email' ? 'email' : 'text'} />
                </Field>
              ))}
            </Grid>
          </SettingsSection>
          <SettingsSection title="Others" description="Regional information">
            <Stack gap="medium">
              <Choice label="Currency" options={['USD', 'EUR', 'GBP']} />
              <Choice label="Language" options={['English', 'Spanish', 'French']} />
              <Choice label="Time Zone" options={['Europe/Madrid', 'America/New_York', 'UTC']} />
            </Stack>
          </SettingsSection>
          <Button onClick={() => toast.info('Preview only — no profile changes were saved.')}>
            Save changes
          </Button>
        </>
      ) : (
        <SettingsSection
          title="Personal information"
          description="Your profile is securely managed by Clerk."
        >
          <Button onClick={onManage}>Manage your profile</Button>
        </SettingsSection>
      )}
    </Panel>
  );
}

function SessionList() {
  return (
    <section>
      <h3>Active Sessions</h3>
      {SampleSessions.map((device, index) => (
        <ListRow
          key={device}
          title={device}
          description={
            index ? 'Example session · Last active 3 hours ago' : 'Example session · Current device'
          }
        >
          {index ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Example session — no session was ended.')}
            >
              Log Out
            </Button>
          ) : (
            <Badge>Current</Badge>
          )}
        </ListRow>
      ))}
      <Text tone="muted">Sample session data for component review.</Text>
    </section>
  );
}

export function SecuritySettings({ demo, onManage }: { demo: boolean; onManage: () => void }) {
  return (
    <Panel title="Security">
      <ListRow title="Change Password" description="Manage your password and account access">
        <Button variant="outline" onClick={onManage}>
          Manage
        </Button>
      </ListRow>
      {demo ? (
        <>
          <ListRow
            title="Two-Factor Authentication"
            description="Preview of the security preference control"
          >
            <ToggleSwitch aria-label="Preview two-factor authentication" />
          </ListRow>
          <ListRow
            title="Biometric Login"
            description="Preview of the biometric preference control"
          >
            <ToggleSwitch aria-label="Preview biometric login" />
          </ListRow>
          <SessionList />
        </>
      ) : (
        <ListRow
          title="Authentication & sessions"
          description="Manage authentication and active sessions through your account provider."
        >
          <Button variant="outline" onClick={onManage}>
            Open account security
          </Button>
        </ListRow>
      )}
    </Panel>
  );
}

export function NotificationSettings() {
  return (
    <Panel title="Notifications">
      <Notice>Preference preview. Notification delivery is not connected.</Notice>
      {NotificationPreferences.map(([title, description]) => (
        <ListRow key={title} title={title} description={description}>
          <ToggleSwitch aria-label={title} defaultChecked />
        </ListRow>
      ))}
      <h3>Delivery Method</h3>
      <fieldset className="settings-panels__channels">
        <legend>Notification channels</legend>
        {DeliveryChannels.map((label, index) => (
          <label className="settings-panels__radio" key={label}>
            <input
              className="settings-panels__radio-input"
              type="radio"
              name="delivery"
              defaultChecked={index === 0}
            />
            {label}
          </label>
        ))}
      </fieldset>
    </Panel>
  );
}

export function DataSettings({ demo }: { demo: boolean }) {
  const cache = useQueryClient();

  const exportData = async () => {
    try {
      if (demo) return exportTransactions(SampleTransactions);
      const response = await fetch('/api/transactions');

      if (!response.ok) throw new Error();
      exportTransactions((await response.json()) as TransactionRow[]);
    } catch {
      toast.error('Unable to export transactions. Please try again.');
    }
  };

  return (
    <Panel title="Data Management">
      <ListRow title="Export Transactions" description="Download your transaction history">
        <Button variant="outline" onClick={() => void exportData()}>
          Export as CSV
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print / PDF
        </Button>
      </ListRow>
      <ListRow
        title="Download Reports"
        description="Open analytics to review and print your financial overview"
      >
        <Button asChild variant="outline">
          <a href="/analytics">View reports</a>
        </Button>
      </ListRow>
      <ListRow title="Clear Cached Data" description="Refresh financial data from the server">
        <Button
          variant="outline"
          onClick={() => {
            void cache.invalidateQueries();
            toast.success('Refreshing cached financial data.');
          }}
        >
          Refresh cache
        </Button>
      </ListRow>
    </Panel>
  );
}

export function AppPreferences() {
  return (
    <Panel title="App Preferences">
      <Notice>
        Appearance applies to the app. Other controls preview future display preferences.
      </Notice>
      <Stack gap="medium">
        <Choice label="Default Dashboard View" options={['Monthly', 'Weekly', 'Daily']} />
        <Choice label="Date Format" options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} />
        <Choice label="Number Format" options={['1,234,567.89 (Comma)', '1.234.567,89 (Dot)']} />
        <Choice
          label="Appearance"
          options={[AppearancePlaceholder, 'Light', 'Dark', 'System']}
          onChange={value => {
            if (value !== AppearancePlaceholder) applyTheme(value.toLowerCase());
          }}
        />
      </Stack>
    </Panel>
  );
}

export function SupportLinks() {
  const [expanded, setExpanded] = useState('');

  return (
    <Panel title="Legal & Support">
      {SupportTopics.map(([label, description]) => (
        <div key={label}>
          <ListRow
            title={label}
            description={
              label === 'Help Center' ? 'Find answers to common questions' : 'Project information'
            }
          >
            <Button
              variant="ghost"
              aria-expanded={expanded === label}
              onClick={() => setExpanded(expanded === label ? '' : label)}
            >
              View
            </Button>
          </ListRow>
          {expanded === label && <Notice>{description}</Notice>}
        </div>
      ))}
      <Text tone="muted">CoinKeeper · Personal budget tracker</Text>
    </Panel>
  );
}
