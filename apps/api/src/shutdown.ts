import type { FastifyBaseLogger } from 'fastify';

export const SHUTDOWN_TIMEOUT_MS = 8000;
export const EXIT_SUCCESS = 0;
export const EXIT_FAILURE = 1;

export type ShutdownOptions = {
  closeApp: () => Promise<void>;
  closeDatabase: () => Promise<void>;
  exit: (code: number) => void;
  log: Pick<FastifyBaseLogger, 'error' | 'info'>;
  timeoutMs?: number;
};

const failAfter = (timeoutMs: number) => {
  let timer: NodeJS.Timeout | undefined;

  const expired = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Shutdown did not finish within ${timeoutMs} ms`));
    }, timeoutMs);
    timer.unref();
  });

  return { cancel: () => clearTimeout(timer), expired };
};

const closeAll = async ({ closeApp, closeDatabase }: ShutdownOptions) => {
  try {
    await closeApp();
  } finally {
    await closeDatabase();
  }
};

export const shutDown = async (options: ShutdownOptions): Promise<void> => {
  const { exit, log, timeoutMs = SHUTDOWN_TIMEOUT_MS } = options;
  const deadline = failAfter(timeoutMs);

  try {
    await Promise.race([closeAll(options), deadline.expired]);
    log.info('Shutdown complete');
    exit(EXIT_SUCCESS);
  } catch (error) {
    log.error(error, 'Shutdown failed');
    exit(EXIT_FAILURE);
  } finally {
    deadline.cancel();
  }
};
