# Title

CAIOS WebMCP Agent Gateway

## One-line Summary

A synthetic pet-care page where people and agents safely read context, preview
a structured check-in, explicitly confirm it, commit it locally, and verify the
same state together through five WebMCP tools.

## Problem

Pet-care dashboards contain useful context, but agents typically have to infer
actions from visual controls. That makes collaboration brittle and makes
consequential writes difficult to review.

## Solution

CAIOS WebMCP Agent Gateway exposes five narrow capabilities from the live page.
Three tools read synthetic Pika context. A fourth validates and previews a
daily check-in. The fifth commits only the unchanged, confirmed payload to
namespaced browser storage.

## Why this is a strong fit for WebMCP

The value exists specifically because the person and agent share the same live
page and browser session. The agent receives intentional tool schemas instead
of guessing how to manipulate a form, while the person retains the visible
interface, confirmation step, and ability to verify the result.

## Better user experience

- Fewer brittle clicks and form interpretations.
- Explicit read-versus-write semantics.
- A visible preview before mutation.
- Confirmation tied to the exact proposed payload.
- Immediate verification in both the page and agent response.
- Graceful fallback when WebMCP is unavailable.

## What people and agents can do together now

A person can ask an agent to review fictional pet context, prepare a structured
check-in, inspect the exact proposal, approve it, and then verify the result on
the same page. Previously, the agent would need to infer controls and state
from the UI, with no purpose-built preview/confirmation contract.

## How WebMCP was implemented

The top-level page feature-detects
`document.modelContext.registerTool` and registers exactly five JavaScript
tools with narrow JSON schemas, side-effect annotations, synthetic-only
results, browser storage isolation, validation, and fail-closed confirmation
guards. Unsupported browsers keep the full human interface.

## Key features

- Exactly five discoverable WebMCP tools.
- Synthetic Pika data only.
- Shared human/agent page state.
- Payload-bound preview and confirmation.
- Explicit reset confirmation.
- Focused automated safety tests.
- No backend, credentials, or production CAIOS dependency.

## Architecture

```text
Human UI + WebMCP Agent
          |
Five top-level site tools
          |
Validation + confirmation guard
          |
Namespaced browser localStorage
          |
Visible shared verification
```

## Testing instructions

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

## Public repository

https://github.com/corwinlim/caios-webmcp-challenge

## Public demo

TODO: add deployed URL.

## Demo video

TODO: add public YouTube URL under three minutes.

## Screenshot shot list

1. Hero, synthetic boundary, and five-tool list.
2. Site tools panel showing exactly five tools.
3. Denied direct commit without preview.
4. Preview payload and confirmation token.
5. Successful commit visible in the page timeline.

## Known limitations

- Requires a WebMCP-compatible browser for site-tool discovery.
- Mutable demo state is local to one browser.
- The confirmation token is a deterministic demo guard, not an authentication credential.
- This is decision support, not veterinary diagnosis or emergency care.
- Production CAIOS functionality is intentionally outside the public demo.

## TODO official form fields

- Add public deployment URL.
- Add public YouTube demo URL.
- Confirm final project title and tagline.
- Copy exact official form questions before final submission.
