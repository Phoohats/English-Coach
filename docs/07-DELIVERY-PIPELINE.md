# Delivery Pipeline

## Change classification

Every pull request declares one or more change classes.

| Class | Required gates |
|---|---|
| Code | lint, typecheck, unit tests, contract tests |
| Lesson content | schema, cross-field validation, preview, curriculum review |
| Database | migration test, compatibility test, invariant check, recovery plan |
| Prompt or model | golden cases, rubric agreement, safety, latency, and cost checks |
| Security or privacy | ownership tests, redaction review, retention and deletion checks |

## Pull request flow

1. Create a small branch from `main`.
2. State user impact, affected contracts, risk class, and rollback plan.
3. Add or update a regression test before changing behavior.
4. Run `npm run verify` locally, including coverage thresholds.
5. For Firebase changes, also run `npm run test:firebase`, `npm run test:firebase:lifecycle`, and `npm run audit:security`.
6. Open a pull request and require `Quality gates / verify`, which aggregates core quality, Firebase emulator, security audit, and pull-request dependency review jobs.
7. Require review for contracts, migrations, privacy, or scoring changes.
8. Merge only when the branch is current with `main` and every required check passes.

## Release flow

1. Deploy compatible database expansion first when required.
2. Deploy application changes behind a disabled feature flag.
3. Run preview smoke and end-to-end tests.
4. Enable for internal users, then a small canary cohort.
5. Observe errors, latency, cost, fallback rate, and scoring anomalies.
6. Promote gradually or disable the flag and roll back the application.
7. Run contract cleanup in a later release only after old usage reaches zero.

## Verified GitHub branch protection

- `main` requires changes to arrive through a pull request.
- The GitHub Actions `verify` check is required, aggregates every quality job fail-closed, and the branch must be current before merge.
- Pull-request conversations must be resolved.
- Administrators cannot bypass the protection.
- Force pushes and branch deletion are disabled.
- Required approvals are temporarily disabled in solo-owner mode because a pull-request author cannot approve their own work. Enable one approval and stale-approval dismissal as soon as an independent reviewer account is available.

The rule was live-verified on 2026-08-30 against `Phoohats/English-Coach`. Until an independent reviewer exists, the human owner remains the final merge gate and Agents must not merge their own pull requests.

## AI release gate

No real provider is enabled by default. Each AI feature must add a versioned golden dataset that includes normal, irrelevant, unsafe, unavailable-provider, and Thai-accent edge cases. Model or prompt changes cannot ship when task completion, factual preservation, safety, latency, or cost crosses the approved threshold.

## Rollback invariant

Application rollback must work against the currently expanded database schema. Published lessons and historical attempts are never edited during rollback. Feature flags provide the first response; application rollback is second; destructive database rollback is not an ordinary recovery mechanism.
