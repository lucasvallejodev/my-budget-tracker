'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { revokeSession } from '@/api/mutations';
import { Badge, Button, EmptyState, ListRow, QueryContent } from '@/components/ui';

import { QueryKeys, type Session, useSessions } from '../use-finance-data';

const BrowserNames = ['Edge', 'Firefox', 'Chrome', 'Safari'];
const SystemNames = ['Windows', 'Android', 'iPhone', 'iPad', 'Mac OS', 'Linux'];

export const describeDevice = (userAgent: string | null): string => {
  if (!userAgent) return 'Unknown device';

  const browser = BrowserNames.find(name => userAgent.includes(name)) ?? 'Browser';
  const system = SystemNames.find(name => userAgent.includes(name));

  return system ? `${browser} on ${system}` : browser;
};

const describeSession = (session: Session): string =>
  [
    `Last active ${new Date(session.lastUsedAt).toLocaleString()}`,
    session.ipAddress && `from ${session.ipAddress}`,
  ]
    .filter(Boolean)
    .join(' ');

export function SessionList() {
  const sessions = useSessions();
  const queryClient = useQueryClient();

  const revoke = useMutation({
    mutationFn: revokeSession,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success('Signed out on that device');
      await queryClient.invalidateQueries({ queryKey: QueryKeys.sessions });
    },
  });

  const items = sessions.data ?? [];

  return (
    <QueryContent
      pending={sessions.isPending}
      loading="Loading sessions…"
      error={sessions.isError}
      empty={!items.length && <EmptyState title="No active sessions" />}
    >
      {() =>
        items.map(session => (
          <ListRow
            key={session.id}
            title={describeDevice(session.userAgent)}
            description={describeSession(session)}
          >
            {session.current ? (
              <Badge>This device</Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(session.id)}
              >
                Sign out
              </Button>
            )}
          </ListRow>
        ))
      }
    </QueryContent>
  );
}
