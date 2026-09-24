'use client';

import './settings-view.scss';

import * as Tabs from '@radix-ui/react-tabs';
import Link from 'next/link';
import { toast } from 'sonner';

import { Badge, Button, Cluster, Notice, Page, PageHeading, Panel, Text } from '@/components/ui';
import { useHydrated } from '@/lib/hydration';

import { LinkedAccount } from '../linked-account';
import { PaymentCardList } from '../payment-card-list';
import { SampleCards } from '../sample-data';
import { useCurrentUser } from '../use-finance-data';
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
  'Deleted items',
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

const LinkSections = [
  {
    description:
      'Manage the groups and categories used to classify your spending. Groups own the colour; categories own the icon.',
    links: [{ href: '/settings/categories', label: 'Open the category manager' }],
    title: 'Categories',
  },
  {
    description:
      'Set your primary currency, toggle converted totals and maintain exchange rates by hand.',
    links: [{ href: '/settings/currencies', label: 'Open currency settings' }],
    title: 'Currencies',
  },
  {
    description: 'Import bank CSV exports and keep rules that categorise entries automatically.',
    links: [
      { href: '/import', label: 'Import transactions' },
      { href: '/settings/rules', label: 'Manage rules' },
    ],
    title: 'Rules & Import',
  },
  {
    description:
      'Deleted transactions, transfers, accounts, rules and exchange rates are kept. Review them and bring any of them back.',
    links: [{ href: '/settings/deleted', label: 'Open deleted items' }],
    title: 'Deleted items',
  },
];

function LinkSection({ section }: { section: (typeof LinkSections)[number] }) {
  return (
    <Tabs.Content value={section.title}>
      <LinkPanel title={section.title} description={section.description}>
        <Cluster>
          {section.links.map(link => (
            <Button asChild variant="outline" key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </Cluster>
      </LinkPanel>
    </Tabs.Content>
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
  const currentUser = useCurrentUser({ enabled: !demo });
  const user = useHydrated() ? currentUser.data : undefined;

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
            <ProfileSettings demo={demo} user={user} />
            {!demo && user && <Text tone="muted">Signed in as {user.name || user.email}</Text>}
          </Tabs.Content>
          {LinkSections.map(section => (
            <LinkSection key={section.title} section={section} />
          ))}
          <Tabs.Content value="Cards & Accounts">
            <CardsAndAccounts demo={demo} />
          </Tabs.Content>
          <Tabs.Content value="Security">
            <SecuritySettings demo={demo} />
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
