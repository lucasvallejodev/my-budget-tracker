'use client';

import './settings-view.scss';

import * as Tabs from '@radix-ui/react-tabs';
import Link from 'next/link';

import { Button, Cluster, Notice, Page, PageHeading, Panel, Text } from '@/components/ui';
import { useHydrated } from '@/lib/hydration';

import { useCurrentUser } from '../use-finance-data';
import { EmojiPreference, ProfileSettings, SecuritySettings } from './settings-panels';

const Sections = [
  // keep order
  { label: 'Profile', value: 'profile' },
  { label: 'Categories', value: 'categories' },
  { label: 'Currencies', value: 'currencies' },
  { label: 'Rules', value: 'rules' },
  { label: 'Security', value: 'security' },
  { label: 'Deleted items', value: 'deleted' },
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
    value: 'categories',
  },
  {
    description:
      'Set your primary currency, toggle converted totals and maintain exchange rates by hand.',
    links: [{ href: '/settings/currencies', label: 'Open currency settings' }],
    title: 'Currencies',
    value: 'currencies',
  },
  {
    description: 'Keep rules that categorise imported and new entries automatically.',
    links: [{ href: '/settings/rules', label: 'Manage rules' }],
    title: 'Rules',
    value: 'rules',
  },
  {
    description:
      'Deleted transactions, transfers, accounts, rules and exchange rates are kept. Review them and bring any of them back.',
    links: [{ href: '/settings/deleted', label: 'Open deleted items' }],
    title: 'Deleted items',
    value: 'deleted',
  },
];

function LinkSection({ demo, section }: { demo: boolean; section: (typeof LinkSections)[number] }) {
  return (
    <Tabs.Content value={section.value}>
      <LinkPanel title={section.title} description={section.description}>
        <Cluster>
          {section.links.map(link => (
            <Button asChild variant="outline" key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </Cluster>
        {section.title === 'Categories' && !demo && <EmojiPreference />}
      </LinkPanel>
    </Tabs.Content>
  );
}

export function SettingsView({ demo = false }: { demo?: boolean }) {
  const currentUser = useCurrentUser({ enabled: !demo });
  const user = useHydrated() ? currentUser.data : undefined;

  return (
    <Page>
      <PageHeading
        title="Settings"
        description="Your profile, categories, currencies, rules and security."
      />
      {demo && <Notice>Component preview — sample account information.</Notice>}
      <Tabs.Root defaultValue="profile" className="settings-view" orientation="vertical">
        <Tabs.List className="settings-view__nav" aria-label="Settings Sections">
          {Sections.map(section => (
            <Tabs.Trigger className="settings-view__tab" key={section.value} value={section.value}>
              {section.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div>
          <Tabs.Content value="profile">
            <ProfileSettings demo={demo} user={user} />
            {!demo && user && <Text tone="muted">Signed in as {user.name || user.email}</Text>}
          </Tabs.Content>
          {LinkSections.map(section => (
            <LinkSection key={section.title} demo={demo} section={section} />
          ))}
          <Tabs.Content value="security">
            <SecuritySettings demo={demo} />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </Page>
  );
}
