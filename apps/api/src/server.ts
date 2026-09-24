import { buildApp } from './app';
import { openRuntime } from './environment';

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
      void app
        .close()
        .then(close)
        .finally(() => process.exit(0));
    });
  }

  await app.listen({ host: config.host, port: config.port });
};

start().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
