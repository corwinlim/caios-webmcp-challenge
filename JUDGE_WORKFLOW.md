# Three-Minute Judge Workflow

## 0:00–0:25 — The problem

“Pet-care pages hold useful longitudinal context, but an agent normally has
to infer controls from the visual interface. CAIOS WebMCP Agent Gateway gives
the live page five explicit, narrow tools, so a person and agent can safely
work from the same state.”

Show the **Synthetic hackathon build** and **Data boundary** labels.

## 0:25–0:55 — Discover and read

Open **Site tools** in the compatible browser and show exactly five tools.

Ask the agent:

> Read synthetic Pika's profile, today's focus, and the five most recent events.

The agent calls:

- `get_synthetic_pika_profile`
- `get_synthetic_pika_today`
- `list_synthetic_pika_events` with `limit: 5`

Point out `dataBoundary: synthetic_hackathon_only`.

## 0:55–1:25 — Demonstrate the guard

Ask the agent to call `commit_synthetic_pika_check_in` directly with:

```json
{
  "appetite": "reduced",
  "stoolScore": 5,
  "energy": "normal",
  "note": "Judge workflow"
}
```

Show that the write fails closed because it was not previewed and confirmed.

## 1:25–2:10 — Preview, human review, confirm

Ask the agent to preview the same payload with
`preview_synthetic_pika_check_in`.

Read the preview and explain that the returned token is cryptographically
lightweight but payload-bound: changing any field invalidates it.

After the person reviews the proposal, ask the agent to call
`commit_synthetic_pika_check_in` with the unchanged payload and returned
token.

## 2:10–2:40 — Shared verification

Show that the visible page updates. Ask the agent to read Today and Events
again. The person and agent now see the same committed browser-only state.

## 2:40–3:00 — Why WebMCP

“Before WebMCP, an agent had to interpret form controls and hidden application
state. Here, the website exposes intentional capabilities with narrow schemas,
clear side effects, and confirmation guards—while the person keeps the normal
visual interface and final control.”

Close on:

> One pet-care page. One shared state for people and agents.

## Recording checklist

- Public demo URL visible.
- Site tools panel and all five tool names visible.
- Failed unconfirmed write visible.
- Preview token visible without exposing any secret.
- Successful confirmed write and visible verification shown.
- Audio narration included.
- Total duration under three minutes.
