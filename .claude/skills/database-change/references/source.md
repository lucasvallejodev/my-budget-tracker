# Sources

> Summary: upstream material this skill was built from, its license, and what was changed.

| Upstream file                                                                                | License    | Used for                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [mindrally/skills](https://github.com/mindrally/skills) `postgresql-best-practices/SKILL.md` | Apache-2.0 | Partial and covering indexes, `EXPLAIN (ANALYZE, BUFFERS)`, index-usage query, CTE materialisation, session timeouts, advisory locks, `pg_stat_statements`. |
| [mindrally/skills](https://github.com/mindrally/skills) `drizzle-orm/SKILL.md`               | Apache-2.0 | Index declaration in the third `pgTable` argument, selecting only needed columns, avoiding N+1, transactions.                                               |
| [mindrally/skills](https://github.com/mindrally/skills) `sql-best-practices/SKILL.md`        | Apache-2.0 | Sargable range filters, `EXISTS`, filtering before grouping.                                                                                                |

The Apache-2.0 material was modified: the upstream files are generic guides; this skill keeps only the ideas above, rewritten for CoinKeeper's schema, services and conventions. Removed or reversed upstream advice: `NUMERIC` for money (we use signed integer minor units), hard deletes, `serial` ids and `timestamp` without time zone, returning `InferSelectModel` rows, "let drizzle-kit manage migration history" without hand-written SQL, row-level security, partitioning, PgBouncer, JSONB, T-SQL syntax, singular table names and explanatory comments in SQL. Everything about the single-transaction migrator, expand/contract steps on PostgreSQL 17, the `--custom` workflow, the batching patterns and the connection settings was written for this repository.
