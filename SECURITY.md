# Security Policy

## Scope

This repository is a browser-only synthetic-data demonstration. It must not
receive, store, or process production credentials, customer data, real pet
health records, payment information, or private CAIOS data.

## Reporting

Please report a suspected vulnerability privately through GitHub's
**Report a vulnerability** feature for this repository. Do not include real
personal, customer, pet-health, credential, or production data in a report.

## Supported version

Only the current `main` branch is supported during the WebMCP Challenge.

## Safety invariants

- Exactly five narrowly scoped site tools.
- Every result declares `synthetic_hackathon_only`.
- Writes remain under the namespaced browser storage key.
- Writes require a token bound to the exact previewed payload.
- Reset fails closed without the explicit confirmation phrase.
- No production network request is made.
