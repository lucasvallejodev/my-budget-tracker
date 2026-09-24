const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

const hasPostgresCode = (error: unknown, code: string): boolean => {
  if (!error || typeof error !== 'object') return false;
  if ('code' in error && error.code === code) return true;

  return 'cause' in error && hasPostgresCode(error.cause, code);
};

export const isUniqueViolation = (error: unknown): boolean =>
  hasPostgresCode(error, UNIQUE_VIOLATION);

export const isForeignKeyViolation = (error: unknown): boolean =>
  hasPostgresCode(error, FOREIGN_KEY_VIOLATION);
