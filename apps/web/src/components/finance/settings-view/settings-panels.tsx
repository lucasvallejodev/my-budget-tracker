'use client';

import './settings-panels.scss';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { updateSettings } from '@/api/mutations';
import {
  Badge,
  Button,
  Cluster,
  Field,
  Grid,
  Input,
  ListRow,
  Panel,
  PillSelect,
  SettingsSection,
  Stack,
  Text,
  ToggleSwitch,
} from '@/components/ui';

import { PasswordForm } from '../password-form';
import { ProfileForm } from '../profile-form';
import { SessionList } from '../session-list';
import { User, useRefreshFinance, useSettings } from '../use-finance-data';

const PersonalFields = ['First name', 'Last name', 'Email', 'Phone', 'Address'];
const SampleSessions = ['Chrome on Windows', 'Safari on iPhone', 'Firefox on MacBook'];

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
      <PillSelect
        onValueChange={onChange}
        options={options.map(option => ({ label: option, value: option }))}
      />
    </Field>
  );
}

const previewOnly = () => toast.info('Component preview — account services are not changed.');

export function ProfileSettings({ demo, user }: { demo: boolean; user?: User }) {
  return (
    <Panel title="Profile Information">
      {demo && (
        <SettingsSection title="Profile Photo" description="Basic profile information">
          <Cluster>
            <span className="settings-panels__avatar">AM</span>
            <Button variant="outline" onClick={previewOnly}>
              Preview photo control
            </Button>
          </Cluster>
        </SettingsSection>
      )}
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
          description="Your name and the email address you sign in with."
        >
          {user ? <ProfileForm user={user} /> : <Text tone="muted">Loading your profile…</Text>}
        </SettingsSection>
      )}
    </Panel>
  );
}

function SampleSessionList() {
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

export function SecuritySettings({ demo }: { demo: boolean }) {
  return (
    <Panel title="Security">
      {demo ? (
        <>
          <ListRow title="Change Password" description="Manage your password and account access">
            <Button variant="outline" onClick={previewOnly}>
              Manage
            </Button>
          </ListRow>
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
          <SampleSessionList />
        </>
      ) : (
        <>
          <SettingsSection
            title="Change password"
            description="Changing it signs you out on every other device."
          >
            <PasswordForm />
          </SettingsSection>
          <SettingsSection
            title="Active sessions"
            description="Devices where you are signed in. Sign out of any you do not recognise."
          >
            <SessionList />
          </SettingsSection>
        </>
      )}
    </Panel>
  );
}

export function EmojiPreference() {
  const settings = useSettings();
  const refresh = useRefreshFinance();

  const save = useMutation({
    mutationFn: updateSettings,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success('Preference saved');
      await refresh();
    },
  });

  return (
    <ListRow
      title="Emoji for categories and payees"
      description="Offer an emoji next to the icons when you pick how a category or payee looks."
    >
      <ToggleSwitch
        aria-label="Allow emoji for categories and payees"
        checked={!!settings.data?.allowEmoji}
        disabled={save.isPending}
        onCheckedChange={checked => save.mutate({ allowEmoji: checked })}
      />
    </ListRow>
  );
}
