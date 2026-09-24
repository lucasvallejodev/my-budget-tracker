# Endpoint preview format

Swagger-like, collapsed by default. One `<details>` per endpoint; the summary line alone must tell the reader what it is. Leave a blank line after `<summary>` and before `</details>` so GitHub renders the Markdown inside.

## Single endpoint

````markdown
<details>
<summary><code>POST</code> <code>/api/v1/transactions/{id}/restore</code> — ADDED · restore a deleted transaction</summary>

**Auth:** session cookie · **Origin check:** yes (write)

**Path parameters**

| Name | Type | Notes          |
| ---- | ---- | -------------- |
| `id` | uuid | transaction id |

**Body:** none

**Responses**

| Status | Body             | When                                                            |
| ------ | ---------------- | --------------------------------------------------------------- |
| `200`  | `TransactionRow` | restored, `deletedAt` is `null`                                 |
| `404`  | `{ error }`      | no deleted transaction with that id for this user               |
| `409`  | `{ error }`      | its account is deleted, or the same bank row was imported again |

**Example**

```http
POST /api/v1/transactions/6b1c…/restore
```

```json
{ "id": "6b1c…", "amountMinor": -1250, "currency": "EUR", "deletedAt": null }
```

</details>
````

## Rules

- Summary line: `<code>METHOD</code> <code>path</code> — ADDED|MODIFIED|REMOVED · <one-line purpose>`. Use `{param}` for path parameters.
- Sections, in order, only when they apply: Auth, Path parameters, Query parameters, Body, Responses, Example. For `MODIFIED`, start with a **What changed** line.
- Types come from the Zod schemas in `packages/shared/src/schema/`; name the response type (`AccountSummary`, `{ items: RuleRow[] }`) instead of expanding every field, and expand only fields that are new.
- Error bodies are always `{ "error": { "code", "message", "fields"? } }`; list the status codes a client should handle, not every possible one.
- Examples are short and realistic; shorten ids with `…`; never include real personal data, tokens or cookies.
- Many endpoints: wrap them in an outer `<details>` per resource, `<summary><b>Transactions</b> (5)</summary>`.
