# Core QA Report

## 1. Summary

Decision: **GO for adding the first product feature behind a disabled feature flag.**

The local core foundation is reproducible from the lockfile and enforces lint, strict TypeScript, regression coverage, lesson validation, attempt version pins, feature flags, and AI fallback behavior. It contains no production UI, database, authentication, learner data, or Gemini connection.

## 2. User lens

- No user interface exists, so mobile, accessibility, navigation, recording, and learning-flow tests are not yet applicable.
- The core prevents a provider failure from removing the deterministic fallback response.
- Risky features are disabled by default and unknown flags fail closed.
- Lesson examples remain valid after the validator became executable code.

## 3. Engineer lens

- Dependencies install reproducibly with `npm ci`.
- Pull requests run one quality workflow using the same `npm run verify` command as local development.
- Lesson and attempt contracts use strict JSON Schema plus cross-field validation.
- Scored attempts require a score and pin lesson, activity, objective, rubric, schema, prompt, and model context.
- Database changes have an explicit Expand-Migrate-Contract policy.
- GitHub Actions are pinned to full release commit SHAs.
- Branch protection, remote CI execution, database restore, tenant isolation, and real-provider failure remain live-verification items.

## 4. Issues found

| Finding | Priority | Status | Resolution |
|---|---:|---|---|
| Unused TypeScript import blocked lint | P3 | Already fixed | Removed the unused import and reran all gates |
| Feature-flag literal type and AJV ESM import blocked strict typecheck | P2 | Already fixed | Declared boolean flag state and used AJV's named class export |
| Attempt conditional schema failed AJV strict compilation | P1 | Already fixed | Defined `score` inside the conditional branch and added a regression test |
| Initial tests missed enough failure branches to meet coverage | P2 | Already fixed | Added six contract failure tests instead of lowering thresholds |
| Workflow used obsolete major action versions | P2 | Already fixed | Pinned checkout v6.0.2 and setup-node v6.4.0 release SHAs |
| GitHub branch protection is not active locally | P1 | Needs live verification | Configure required review and `Quality gates / verify` after remote creation |
| Database, auth, storage, and real AI adapters do not exist | P1 for production | Expected/deferred | Add one adapter at a time with the relevant pipeline gates |

## 5. Checks run

- Clean dependency reconstruction: `npm ci` passed.
- Dependency audit: zero reported vulnerabilities.
- ESLint: passed.
- TypeScript strict typecheck: passed.
- Vitest: 20 of 20 tests passed across three test files.
- Coverage: lines 100%, functions 100%, statements 87.05%, branches 77.77%.
- Coverage thresholds: lines 85%, functions 85%, statements 85%, branches 75%; all passed.
- Contract validation: two lessons and one attempt example valid.
- Secret pattern scan: zero matches.

## 6. Regression gates now enforced

- Invalid skill or rubric totals fail.
- Unknown objective references fail.
- Duplicate objective/activity IDs fail.
- Malformed activity-specific content fails.
- Lesson duration and skill-time drift fail outside tolerance.
- A scored attempt without a score fails.
- Invalid submission timestamps fail.
- Unknown feature flags remain disabled.
- AI provider failure returns the deterministic fallback.

## 7. Required tests with the first feature

- Repository adapter: duplicate idempotency and concurrent attempt tests.
- Authentication: guest, expired, cross-user, and deletion tests.
- Database: migration compatibility, invariant, backup, and restore tests.
- UI: mobile, keyboard, screen-reader, empty, loading, error, and offline states.
- Gemini: golden dataset, privacy configuration, timeout, cost, safety, and factual-preservation tests.

## 8. Final recommendation

The core is ready for incremental development. Start each feature disabled, add its contract and regression test first, then enable only after preview and canary checks. Production deployment remains **NO-GO** until the remote CI, branch protection, persistent storage, authentication, privacy, and live-provider gates are verified.
