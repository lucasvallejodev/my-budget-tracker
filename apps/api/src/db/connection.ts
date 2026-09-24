export const databaseUrl = (value = process.env.DATABASE_URL): string => {
  if (!value) {
    throw new Error('DATABASE_URL is required. Set a direct PostgreSQL connection URL in .env.');
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL.');
  }

  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error(
      'DATABASE_URL must use postgres:// or postgresql://. ORM proxy URLs are not supported; use the direct connection URL for your database.'
    );
  }

  if (url.hostname === 'accelerate.prisma-data.net' || url.searchParams.has('api_key')) {
    throw new Error(
      'DATABASE_URL is an Accelerate API endpoint, not a direct PostgreSQL connection. Copy the direct database connection string from your provider; changing the URL prefix is not sufficient.'
    );
  }

  return value;
};
