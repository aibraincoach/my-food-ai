# Connect an agent

Open Profile → Connect an agent, give it a name, then choose **Create token**.
Copy the token into your assistant's settings. It is shown once. If you lose it,
revoke it and create another. Only a SHA-256 digest and its last four characters
are saved. Keep the token private; anyone holding it can use its permissions.

The token can post a meal, read your meals and add a correction. Posts made by an
agent stay yours and show “via” followed by its name in the feed. Open Profile →
Agents to inspect activity or revoke a token. Revocation takes effect on the next
request. It keeps existing posts and activity.

## MCP

Use the app's `/mcp` endpoint as a Streamable HTTP MCP server and add the header
`Authorization: Bearer <token>`. Replace `<app origin>` and `<token>` in these
examples. The server implements tools over JSON-RPC 2.0, with one request or a
batch per POST. It does not open a server-initiated event stream.

```sh
curl '<app origin>/mcp' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"my-assistant","version":"1"}}}'

curl '<app origin>/mcp' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"log_meal","arguments":{"caption":"coffee","eaten_at":"2026-11-02T08:00:00Z"}}}'
```

Supported methods: `initialize`, `notifications/initialized`, `ping`, `tools/list`
and `tools/call`. The protocol version is `2025-06-18`. GET returns 405; DELETE
ends the stateless session with 204 after token authentication. Notifications
return 202. Tool refusals return text content with `isError: true`.

| Tool | Fields | Result |
| --- | --- | --- |
| `log_meal` | `caption` (1–2000 characters), optional `eaten_at` (ISO instant in the past; defaults to now) | Meal id, caption, time eaten, queued status |
| `list_meals` | Optional `from` (inclusive), `to` (exclusive), `limit` (1–50, default 20) | Owned meals newest first, with consumed totals when ready |
| `get_meal` | `id` | Owned meal, items, consumed totals and thread |
| `correct_meal` | `id`, `text` (1–4000 characters) | Queued correction |

Times include a time-zone offset or `Z`; date ranges also accept ISO dates. A
meal's `eaten_at` is when it was eaten, separate from when the agent posted it.
Nutrition appears after processing. A token cannot read or correct another
person's meal.

## HTTP API

Use the same Bearer header and JSON request bodies:

| Route | Method | Fields |
| --- | --- | --- |
| `/api/agent/meals` | POST | Same as `log_meal` |
| `/api/agent/meals` | GET | Query fields from `list_meals` |
| `/api/agent/meals/<id>` | GET | Same as `get_meal` |
| `/api/agent/meals/<id>` | POST | `{ "text": "the correction" }` |

Both interfaces share a limit of **60 calls per minute per token**. Each entry
in an MCP batch counts separately. A refused request returns 429 with
`{"error":"Too many requests"}`; try again in the next minute. A missing,
invalid or revoked token returns 401 with `{"error":"Token required"}`.
