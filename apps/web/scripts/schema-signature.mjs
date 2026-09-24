const Tables = [
  'currencies',
  'user_settings',
  'accounts',
  'category_groups',
  'categories',
  'payees',
  'transactions',
  'exchange_rates',
  'budgets',
  'rules',
];

const Enums = [
  'account_type',
  'account_classification',
  'category_kind',
  'transaction_kind',
  'transaction_status',
];

const EnumSignatureIndex = 3;

const Signatures = [
  `SELECT c.relname AS table_name, a.attname AS column_name, format_type(a.atttypid,a.atttypmod) AS type, a.attnotnull AS required, replace(COALESCE(pg_get_expr(d.adbin,d.adrelid),''),'CURRENT_TIMESTAMP','now()') AS default_value FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE n.nspname='public' AND c.relname=ANY($1::text[]) AND a.attnum>0 AND NOT a.attisdropped ORDER BY c.relname,a.attname`,
  `SELECT c.relname AS table_name, con.conname AS name, con.contype AS kind, pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=ANY($1::text[]) ORDER BY c.relname,con.contype,pg_get_constraintdef(con.oid)`,
  `SELECT t.relname AS table_name, c.relname AS name, replace(pg_get_indexdef(i.indexrelid),quote_ident(c.relname),'<index>') AS definition FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_class t ON t.oid=i.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND t.relname=ANY($1::text[]) ORDER BY t.relname,definition`,
  `SELECT t.typname AS name, e.enumlabel AS value FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname=ANY($1::text[]) ORDER BY t.typname,e.enumsortorder`,
];

export async function readSchemaSignature(database) {
  const result = [];

  for (let index = 0; index < Signatures.length; index++) {
    result.push(
      (await database.query(Signatures[index], [index === EnumSignatureIndex ? Enums : Tables]))
        .rows
    );
  }

  return result;
}
