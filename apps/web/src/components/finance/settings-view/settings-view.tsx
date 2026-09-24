'use client';

import './settings-view.scss';

import { useClerk, useUser } from '@clerk/nextjs';
import * as Tabs from '@radix-ui/react-tabs';
import Link from 'next/link';
import { toast } from 'sonner';

import { Badge, Button, Cluster, Notice, Page, PageHeading, Panel, Text } from '@/components/ui';

import { LinkedAccount } from '../linked-account';
import { PaymentCardList } from '../payment-card-list';
import { SampleCards } from '../sample-data';
import {
  AppPreferences,
  DataSettings,
  NotificationSettings,
  ProfileSettings,
  SecuritySettings,
  SupportLinks,
} from './settings-panels';

const Sections = [
  // keep order
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

function LinkPanel({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <Panel title={title}>
      <Text tone="muted">{description}</Text>
      {children}
    </Panel>
  );
}

function CardsAndAccounts({ demo }: { demo: boolean }) {
  if (!demo) {
    return (
      <LinkPanel
        title="Cards & Accounts"
        description="Manage your tracked accounts. Payment card storage is not connected."
      >
        <Button asChild variant="outline">
          <Link href="/accounts">View accounts</Link>
        </Button>
      </LinkPanel>
    );
  }

  return (
    <Panel title="Cards & Accounts">
      <PaymentCardList initialCards={SampleCards} />
      <LinkedAccount
        name="Bank Account"
        detail="Example Bank •••• 5847"
        actions={<Badge>Connected</Badge>}
      />
      <LinkedAccount
        name="Digital Wallet"
        detail="Example wallet account"
        actions={
          <Button variant="outline" onClick={() => toast.info('Example linked account.')}>
            Manage
          </Button>
        }
      />
    </Panel>
  );
}

export function SettingsView({ demo = false }: { demo?: boolean }) {
  const { openUserProfile } = useClerk();
  const { user } = useUser();

  const manage = () => {
    if (demo) toast.info('Component preview — account services are not changed.');
    else openUserProfile();
  };

  return (
    <Page>
      <PageHeading
        title="Settings"
        description="Manage your account, preferences, and security settings."
      />
      {demo && <Notice>Component preview — sample account information.</Notice>}
      <Tabs.Root defaultValue="Profile" className="settings-view" orientation="vertical">
        <Tabs.List className="settings-view__nav" aria-label="Settings Sections">
          {Sections.map(section => (
            <Tabs.Trigger className="settings-view__tab" key={section} value={section}>
              {section}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div>
          <Tabs.Content value="Profile">
            <ProfileSettings demo={demo} onManage={manage} />
            {!demo && (
              <Text tone="muted">
                Signed in as {user?.fullName || user?.primaryEmailAddress?.emailAddress}
              </Text>
            )}
          </Tabs.Content>
          <Tabs.Content value="Categories">
            <LinkPanel
              title="Categories"
              description="Manage the groups and categories used to classify your spending. Groups own the colour; categories own the icon."
            >
              <Button asChild variant="outline">
                <Link href="/settings/categories">Open the category manager</Link>
              </Button>
            </LinkPanel>
          </Tabs.Content>
          <Tabs.Content value="Currencies">
            <LinkPanel
              title="Currencies"
              description="Set your primary currency, toggle converted totals and maintain exchange rates by hand."
            >
              <Button asChild variant="outline">
                <Link href="/settings/currencies">Open currency settings</Link>
              </Button>
            </LinkPanel>
          </Tabs.Content>
          <Tabs.Content value="Rules & Import">
            <LinkPanel
              title="Rules & Import"
              description="Import bank CSV exports and keep rules that categorise entries automatically."
            >
              <Cluster>
                <Button asChild variant="outline">
                  <Link href="/import">Import transactions</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/settings/rules">Manage rules</Link>
                </Button>
              </Cluster>
            </LinkPanel>
          </Tabs.Content>
          <Tabs.Content value="Cards & Accounts">
            <CardsAndAccounts demo={demo} />
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
    </Page>
  );
}
