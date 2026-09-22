'use client';
import { ReactNode, useState } from 'react';
import Link from 'next/link';
import * as Tabs from '@radix-ui/react-tabs';
import { useClerk, useUser } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeading, Panel, SettingsSection, LinkedAccount, StatusBadge } from './blocks';
import { PaymentCardList } from './payment-cards';
import { sampleCards, sampleTransactions } from './sample-data';
import { Input } from '../primitives/input';
import { ToggleSwitch } from '../primitives/preferences';
import { Button } from '../primitives/button';
import { exportTransactions } from './transaction-explorer';
import { TransactionRow } from './use-finance-data';
import { applyTheme } from '../shell/theme-toggle';
import s from './finance.module.scss';
export function PreferenceRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className={s.row}>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
function Choice({
  label,
  options,
  onChange,
}: {
  label: string;
  options: string[];
  onChange?: (value: string) => void;
}) {
  return (
    <label className={s.field}>
      {label}
      <select className={s.filter} onChange={e => onChange?.(e.target.value)}>
        {options.map(option => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
export function ProfileSettings({ demo, onManage }: { demo: boolean; onManage: () => void }) {
  return (
    <Panel title="Profile Information">
      <SettingsSection title="Profile Photo" description="Basic profile information">
        <div className={s.actions}>
          <span className={s.avatar}>AM</span>
          <Button variant="outline" onClick={onManage}>
            {demo ? 'Preview photo control' : 'Manage profile photo'}
          </Button>
        </div>
      </SettingsSection>
      {demo ? (
        <>
          <SettingsSection
            title="Personal Information"
            description="Update your personal information"
          >
            <div className={s.grid}>
              {['First name', 'Last name', 'Email', 'Phone', 'Address'].map(label => (
                <label className={s.field} key={label}>
                  {label}
                  <Input type={label === 'Email' ? 'email' : 'text'} />
                </label>
              ))}
            </div>
          </SettingsSection>
          <SettingsSection title="Others" description="Regional information">
            <div className={s.form}>
              <Choice label="Currency" options={['USD', 'EUR', 'GBP']} />
              <Choice label="Language" options={['English', 'Spanish', 'French']} />
              <Choice label="Time Zone" options={['Europe/Madrid', 'America/New_York', 'UTC']} />
            </div>
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
export function SessionList() {
  return (
    <section>
      <h3>Active Sessions</h3>
      {['Chrome on Windows', 'Safari on iPhone', 'Firefox on MacBook'].map((device, i) => (
        <PreferenceRow
          key={device}
          title={device}
          description={
            i ? 'Example session · Last active 3 hours ago' : 'Example session · Current device'
          }
        >
          {i ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Example session — no session was ended.')}
            >
              Log Out
            </Button>
          ) : (
            <StatusBadge>Current</StatusBadge>
          )}
        </PreferenceRow>
      ))}
      <p className={s.muted}>Sample session data for component review.</p>
    </section>
  );
}
export function SecuritySettings({ demo, onManage }: { demo: boolean; onManage: () => void }) {
  return (
    <Panel title="Security">
      <PreferenceRow title="Change Password" description="Manage your password and account access">
        <Button variant="outline" onClick={onManage}>
          Manage
        </Button>
      </PreferenceRow>
      {demo ? (
        <>
          <PreferenceRow
            title="Two-Factor Authentication"
            description="Preview of the security preference control"
          >
            <ToggleSwitch aria-label="Preview two-factor authentication" />
          </PreferenceRow>
          <PreferenceRow
            title="Biometric Login"
            description="Preview of the biometric preference control"
          >
            <ToggleSwitch aria-label="Preview biometric login" />
          </PreferenceRow>
          <SessionList />
        </>
      ) : (
        <PreferenceRow
          title="Authentication & sessions"
          description="Manage authentication and active sessions through your account provider."
        >
          <Button variant="outline" onClick={onManage}>
            Open account security
          </Button>
        </PreferenceRow>
      )}
    </Panel>
  );
}
export function NotificationSettings() {
  return (
    <Panel title="Notifications">
      <p className={s.notice}>Preference preview. Notification delivery is not connected.</p>
      {[
        ['Transaction Alerts', 'Get notified for transactions on your account'],
        ['Budget Limit Alerts', 'Alerts when approaching your budget limits'],
        ['Monthly Summary Email', 'A monthly overview of income and spending'],
        ['Security Alerts', 'Important account security notifications'],
      ].map(([title, description]) => (
        <PreferenceRow key={title} title={title} description={description}>
          <ToggleSwitch aria-label={title} defaultChecked />
        </PreferenceRow>
      ))}
      <h3>Delivery Method</h3>
      <fieldset className={s.form}>
        <legend>Notification channels</legend>
        {['Email Only', 'Push Notifications Only', 'Both Email and Push'].map((label, i) => (
          <label className={s.radio} key={label}>
            <input type="radio" name="delivery" defaultChecked={i === 0} />
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
      if (demo) return exportTransactions(sampleTransactions);
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error();
      exportTransactions((await response.json()) as TransactionRow[]);
    } catch {
      toast.error('Unable to export transactions. Please try again.');
    }
  };
  return (
    <Panel title="Data Management">
      <PreferenceRow title="Export Transactions" description="Download your transaction history">
        <div className={s.actions}>
          <Button variant="outline" onClick={() => void exportData()}>
            Export as CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            Print / PDF
          </Button>
        </div>
      </PreferenceRow>
      <PreferenceRow
        title="Download Reports"
        description="Open analytics to review and print your financial overview"
      >
        <Button asChild variant="outline">
          <a href="/analytics">View reports</a>
        </Button>
      </PreferenceRow>
      <PreferenceRow title="Clear Cached Data" description="Refresh financial data from the server">
        <Button
          variant="outline"
          onClick={() => {
            void cache.invalidateQueries();
            toast.success('Refreshing cached financial data.');
          }}
        >
          Refresh cache
        </Button>
      </PreferenceRow>
    </Panel>
  );
}
export function AppPreferences() {
  return (
    <Panel title="App Preferences">
      <p className={s.notice}>
        Appearance applies to the app. Other controls preview future display preferences.
      </p>
      <div className={s.form}>
        <Choice label="Default Dashboard View" options={['Monthly', 'Weekly', 'Daily']} />
        <Choice label="Date Format" options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} />
        <Choice label="Number Format" options={['1,234,567.89 (Comma)', '1.234.567,89 (Dot)']} />
        <Choice
          label="Appearance"
          options={['Choose appearance', 'Light', 'Dark', 'System']}
          onChange={value => {
            if (value !== 'Choose appearance') applyTheme(value.toLowerCase());
          }}
        />
      </div>
    </Panel>
  );
}
export function SupportLinks() {
  const [expanded, setExpanded] = useState('');
  return (
    <Panel title="Legal & Support">
      {[
        [
          'Help Center',
          'Create an account first, then record income and expenses from the dashboard. Use Transactions to search and export your records.',
        ],
        ['Privacy Policy', 'The project has not published a privacy policy yet.'],
        ['Terms & Conditions', 'The project has not published terms of service yet.'],
        ['Contact Support', 'A support contact has not been configured for this project.'],
      ].map(([label, description]) => (
        <div key={label}>
          <PreferenceRow
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
          </PreferenceRow>
          {expanded === label && <p className={s.notice}>{description}</p>}
        </div>
      ))}
      <p className={s.muted}>CoinKeeper · Personal budget tracker</p>
    </Panel>
  );
}
const sections = [
  'Profile',
  'Categories',
  'Currencies',
  'Rules & Import',
  'Cards & Accounts',
  'Security',
  'Notifications',
  'Data Management',
  'App Preferences',
  'Legal and support',
];
export function SettingsView({ demo = false }: { demo?: boolean }) {
  const { openUserProfile } = useClerk();
  const { user } = useUser();
  const manage = () => {
    if (demo) toast.info('Component preview — account services are not changed.');
    else openUserProfile();
  };
  return (
    <div className={s.page}>
      <PageHeading
        title="Settings"
        description="Manage your account, preferences, and security settings."
      />
      {demo && <p className={s.notice}>Component preview — sample account information.</p>}
      <Tabs.Root defaultValue="Profile" className={s.settings} orientation="vertical">
        <Tabs.List className={s.settingsNav} aria-label="Settings sections">
          {sections.map(section => (
            <Tabs.Trigger className={s.settingsTab} key={section} value={section}>
              {section}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div>
          <Tabs.Content value="Profile">
            <ProfileSettings demo={demo} onManage={manage} />
            {!demo && (
              <p className={s.muted}>
                Signed in as {user?.fullName || user?.primaryEmailAddress?.emailAddress}
              </p>
            )}
          </Tabs.Content>
          <Tabs.Content value="Categories">
            <Panel title="Categories">
              <p className={s.muted}>
                Manage the groups and categories used to classify your spending. Groups own the
                colour; categories own the icon.
              </p>
              <Button asChild variant="outline">
                <Link href="/settings/categories">Open the category manager</Link>
              </Button>
            </Panel>
          </Tabs.Content>
          <Tabs.Content value="Currencies">
            <Panel title="Currencies">
              <p className={s.muted}>
                Set your primary currency, toggle converted totals and maintain exchange rates by
                hand.
              </p>
              <Button asChild variant="outline">
                <Link href="/settings/currencies">Open currency settings</Link>
              </Button>
            </Panel>
          </Tabs.Content>
          <Tabs.Content value="Rules & Import">
            <Panel title="Rules & Import">
              <p className={s.muted}>
                Import bank CSV exports and keep rules that categorise entries automatically.
              </p>
              <div className={s.actions}>
                <Button asChild variant="outline">
                  <Link href="/import">Import transactions</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/settings/rules">Manage rules</Link>
                </Button>
              </div>
            </Panel>
          </Tabs.Content>
          <Tabs.Content value="Cards & Accounts">
            <Panel title="Cards & Accounts">
              {demo ? (
                <>
                  <PaymentCardList initialCards={sampleCards} />
                  <LinkedAccount
                    name="Bank Account"
                    detail="Example Bank •••• 5847"
                    actions={<StatusBadge>Connected</StatusBadge>}
                  />
                  <LinkedAccount
                    name="Digital Wallet"
                    detail="Example wallet account"
                    actions={
                      <Button
                        variant="outline"
                        onClick={() => toast.info('Example linked account.')}
                      >
                        Manage
                      </Button>
                    }
                  />
                </>
              ) : (
                <>
                  <p className={s.muted}>
                    Manage your tracked accounts. Payment card storage is not connected.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/accounts">View accounts</Link>
                  </Button>
                </>
              )}
            </Panel>
          </Tabs.Content>
          <Tabs.Content value="Security">
            <SecuritySettings demo={demo} onManage={manage} />
          </Tabs.Content>
          <Tabs.Content value="Notifications">
            <NotificationSettings />
          </Tabs.Content>
          <Tabs.Content value="Data Management">
            <DataSettings demo={demo} />
          </Tabs.Content>
          <Tabs.Content value="App Preferences">
            <AppPreferences />
          </Tabs.Content>
          <Tabs.Content value="Legal and support">
            <SupportLinks />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}
