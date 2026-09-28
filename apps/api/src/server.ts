import { buildApp } from './app';
import { openRuntime } from './environment';
import { EXIT_FAILURE, shutDown } from './shutdown';

const ShutdownSignals = ['SIGINT', 'SIGTERM'] as const;
const SESSION_PURGE_INTERVAL_MS = 3_600_000;

const start = async () => {
  const { close, config, db } = openRuntime();
  const app = await buildApp({ config, db: db });

  const purge = setInterval(() => {
    app.services.sessions.purgeExpired().catch((error: unknown) => app.log.error(error));
  }, SESSION_PURGE_INTERVAL_MS);

  for (const signal of ShutdownSignals) {
    process.once(signal, () => {
      clearInterval(purge);
      app.log.info({ signal }, 'Shutting down');
      void shutDown({
        closeApp: () => app.close(),
        closeDatabase: close,
        exit: code => process.exit(code),
        log: app.log,
      });
    });
  }

  await app.listen({ host: config.host, port: config.port });
};

start().catch((error: unknown) => {
  console.error(error);
  process.exit(EXIT_FAILURE);
});
