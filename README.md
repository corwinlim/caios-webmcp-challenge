# CAIOS WebMCP Agent Gateway

An isolated, synthetic-data WebMCP demo for **The WebMCP Challenge**.

**Live demo:** [caios-webmcp-challenge.vercel.app](https://caios-webmcp-challenge.vercel.app)

CAIOS WebMCP Agent Gateway lets a person and an AI agent inspect the same synthetic pet-care page, preview a structured daily check-in, explicitly confirm it, commit it to browser-only demo storage, and verify the result together.

> **Synthetic demo only.** This repository contains no production CAIOS API, customer record, real pet record, private prompt, proprietary memory/context engine, nutrition reasoning, clinical logic, database schema, or authentication secret.

## Why WebMCP

Pet-care pages contain useful context, but agents usually have to infer controls from the visual interface. This project exposes five narrow tools from the live page through `document.modelContext.registerTool(...)`, so the agent can act on the same state the person sees:

1. `get_synthetic_pika_profile`
2. `list_synthetic_pika_events`
3. `get_synthetic_pika_today`
4. `preview_synthetic_pika_check_in`
5. `commit_synthetic_pika_check_in`

The fourth tool is read-only and returns a payload-bound confirmation token. The fifth rejects an unpreviewed or changed payload. Reset requires a separate exact confirmation phrase.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm ci
npm run dev
```

Open the URL printed by Vite in a WebMCP-compatible browser.

## Validate

```bash
npm test
npm run typecheck
npm run build
```

## Three-minute judge flow

1. Open the demo and confirm the page clearly says **Synthetic Pika**.
2. Inspect the five available site tools.
3. Call `get_synthetic_pika_profile`, `get_synthetic_pika_today`, and `list_synthetic_pika_events`.
4. Try to commit a check-in without previewing it; show that the guard denies the write.
5. Preview appetite `reduced`, stool score `5`, energy `normal`, note `Judge workflow`.
6. Review the payload and confirmation token.
7. Commit the unchanged payload with that token.
8. Read Today or Events again and show that the human page and agent now see the same browser-only state.

See [JUDGE_WORKFLOW.md](JUDGE_WORKFLOW.md) for the narrated script.

## Safety and privacy

- All pet data is fictional and identified as `synthetic_hackathon_only`.
- Mutable state stays in the current browser under a namespaced `localStorage` key.
- The demo does not diagnose, prescribe, or replace veterinary care.
- Inputs are narrow, schema-validated, length-limited, and fail closed.
- Unsupported browsers keep the normal human interface and simply do not register site tools.

## Background IP boundary

This is a clean, independently reviewable demonstration adapter. The Apache-2.0 license applies only to files in this public repository. The proprietary CAIOS production platform and all non-published technology remain outside this repository and are not licensed here.

CAIOS and CaniBowl names and logos are not licensed under Apache-2.0. See [NOTICE](NOTICE) and [TRADEMARKS.md](TRADEMARKS.md).

## License

Copyright 2026 Absolute Global Resources PLT.

Licensed under the [Apache License 2.0](LICENSE).
