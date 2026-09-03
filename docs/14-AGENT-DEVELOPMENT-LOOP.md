# Agent Development Loop

## Decision

Use a Firebase modular monolith in one GitHub repository. Keep the learning domain core independent from Firebase and Gemini, and connect infrastructure through typed adapters.

This is the smallest architecture that supports the A1-C1 product, safe parallel Agent work, preview releases, learner data ownership, audio storage, and future provider changes without starting with microservices.

## Goals

- Complete every change through planning, plan review, test design, coding, code review, debugging, testing, release, observation, and documentation update.
- Let multiple Agents work in parallel without editing the same ownership boundary.
- Prevent Firebase, Gemini, UI, and curriculum concerns from leaking into the domain core.
- Make every merge reproducible from a GitHub issue, pull request, checks, preview, and release evidence.
- Prefer small reversible changes and feature flags over large releases.

## Non-goals

- No microservices until measured load or team ownership requires them.
- No direct production deployment from an Agent branch.
- No real learner data in local development or pull request previews.
- No client-side Gemini key or privileged Firebase Admin credential.
- No AI-generated scoring rule, answer key, CEFR objective, or pass threshold without a versioned human-approved contract.

## Target architecture

```text
React PWA / Quiet Editorial UI
          |
Application use cases and typed ports
          |
Learning domain core
  contracts | validation | scheduling | feedback | progression
          |
Firebase adapters
  Auth | Firestore | Storage | Functions v2 | Hosting
          |
Cloud Functions gateways
  Gemini | privileged writes | privacy workflows | analytics events
```

### Dependency rules

1. The domain core imports no React, Firebase, browser, or Gemini modules.
2. UI calls application use cases. It does not implement progression, scoring, or storage policy.
3. Firebase SDK usage stays in adapters and application bootstrap code.
4. Privileged writes and Gemini calls run through Cloud Functions.
5. Firestore stores structured metadata and versioned records. Audio and images live in Cloud Storage.
6. Attempts pin lesson, activity, objective, rubric, prompt, model, schema, and scheduler versions.
7. Published lessons and submitted attempts are immutable; corrections create a new version or event.

## Agent team

| Agent | Owns | Required output | Cannot approve |
|---|---|---|---|
| Orchestrator | issue decomposition, dependencies, state transitions, integration decision | task brief, owner map, current state, evidence index | its own plan or code |
| Plan Reviewer | architecture, scope, failure modes, migration and rollback review | `PLAN_APPROVED` or specific changes requested | implementation |
| Learning Core | contracts, validation, scheduling, feedback, progression | code, unit and contract tests | curriculum evidence or release |
| UI | React views, interaction, accessibility, responsive behavior | code, screenshots, component and E2E tests | learning policy or Firebase rules |
| Firebase | Auth, Firestore, Storage, Functions, rules, emulator and deployment adapters | code, rules tests, migration and recovery evidence | its own security review |
| QA | test plan, negative cases, regression, E2E, accessibility and release verification | test matrix and verification report | failed or skipped required checks |
| Security and Privacy | threat model, ownership, consent, deletion, redaction, secrets and abuse controls | findings by severity and approval state | product acceptance |
| Debug | reproduce failures, trace the failing path, falsify hypotheses, make the smallest fix | reproduction, root cause, regression test, fix evidence | unrelated refactors |
| Integrator and Release | branch currency, preview, canary, production promotion and rollback | release record and observation result | bypassed gates |

Agents are roles, not necessarily permanent processes. One Agent can execute several roles on low-risk work, but plan review, code review, and security approval must be independent from the author for P1 and P2 changes.

## Work contract

Every issue must define these fields before coding:

```yaml
id: ECC-000
goal: One observable learner or operator outcome
non_goals: Explicit exclusions
risk: P1 | P2 | P3
change_classes: [code, content, database, ai, security]
owner_agent: One accountable author
modules: Exact ownership boundaries
dependencies: Blocking issue IDs
acceptance_criteria: Observable pass/fail statements
test_matrix: Unit, contract, rules, integration, E2E, accessibility
data_impact: None, additive, compatible migration, or breaking
rollout: Flag, preview, canary, production
rollback: Flag off, application rollback, or recovery procedure
evidence: Links to plan, review, checks, preview, and release result
```

Use the GitHub issue and pull request as the operational source of truth. Keep only durable architecture decisions, contracts, schemas, and policies in the repository.

## State machine

```text
BACKLOG
  -> DISCOVERY
  -> PLANNED
  -> PLAN_REVIEW
  -> PLAN_APPROVED
  -> TEST_DESIGN
  -> CODING
  -> SELF_REVIEW
  -> CODE_REVIEW
  -> TESTING
       | failure
       v
     DEBUG -> TESTING
  -> PREVIEW
  -> PREVIEW_REVIEW
  -> READY_TO_MERGE
  -> MERGED
  -> CANARY
  -> OBSERVE
  -> UPDATE
  -> DONE
```

Allowed exception states are `CHANGES_REQUESTED`, `BLOCKED`, and `ROLLED_BACK`. An Agent must never jump over a state. The Orchestrator records why a transition occurred and the evidence that allowed it.

## Four control loops

### 1. Planning loop

1. Orchestrator converts the outcome into small issues and a dependency graph.
2. Author Agent traces the existing code path and writes the smallest compatible plan.
3. Plan Reviewer checks contracts, data ownership, migration order, privacy, tests, rollout, and rollback.
4. Requested changes return the issue to `PLANNED`.
5. Coding starts only after `PLAN_APPROVED`.

### 2. Implementation loop

1. QA writes or confirms the test matrix before behavior changes.
2. Author works on `codex/<issue-id>-<short-name>` from the latest `main`.
3. Author adds a failing regression test for changed behavior when practical.
4. Author implements only the approved scope and performs a self-review of the diff.
5. Independent reviewers examine behavior, contracts, security, data compatibility, UI states, and missing tests.

### 3. Debug loop

1. Reproduce the failure with a deterministic command, fixture, or user path.
2. Trace the actual failing path across UI, application, core, adapter, Firebase, and external provider boundaries.
3. State a falsifiable root-cause hypothesis and test it.
4. Add a regression test that fails for the observed reason.
5. Apply the smallest fix and rerun the affected test, then the complete required suite.
6. Update the review with root cause, affected versions, and residual risk.

After three failed attempts with the same blocker, stop automated mutation, mark the task `BLOCKED`, and request a human decision with evidence. Do not keep making speculative edits.

### 4. Release and update loop

1. Deploy a Firebase Hosting preview against the non-production Firebase project.
2. Run smoke, E2E, rules, ownership, accessibility, and mobile/desktop checks.
3. Merge only after required checks and human approval.
4. Release behind a disabled feature flag when the change can affect learning, scoring, privacy, cost, or persistence.
5. Enable for internal users, then a small canary cohort.
6. Observe errors, latency, completion, fallback, scoring anomalies, AI cost, and support signals.
7. Promote, disable the flag, or roll back.
8. Update issue evidence, durable documentation, tests, risk register, and follow-up backlog before `DONE`.

## Parallel work rules

- One issue has one owner, one branch or worktree, and one accountable pull request.
- Two Agents may not edit the same file concurrently unless the Orchestrator assigns non-overlapping sections explicitly.
- Contracts, schemas, Firestore rules, indexes, and migrations are serialized integration points.
- UI, content, test fixtures, and provider adapters may run in parallel only after their shared contract is approved.
- Review Agents start read-only. They do not silently fix the author's branch.
- An Agent reports assumptions, changed files, commands run, failures, skipped checks, and remaining risk.
- Generated content and AI output are untrusted input and must pass the same validation as human-authored data.

## Risk classes

| Risk | Examples | Required approval |
|---|---|---|
| P1 critical | auth bypass, cross-user data, destructive migration, leaked secret, incorrect assessment history | Firebase, Security, QA, human release approval |
| P2 high | scoring, progression, curriculum contract, AI feedback, audio upload, data model | domain owner, QA, relevant specialist, human review |
| P3 normal | isolated UI, copy, internal tooling with no contract change | author self-review, CI, one reviewer |

Any uncertainty about ownership, privacy, scoring, or migration promotes the issue to the higher risk class.

## GitHub pipeline

### Branch and pull request policy

- Protect `main`; disallow direct pushes, force pushes, and deletion.
- Require pull requests, resolved conversations, and current required checks.
- Require at least one human approval when an independent reviewer identity exists. In solo-owner mode, keep the approval count at zero to avoid deadlock, retain every other protection, and require the owner to perform the final merge action.
- Dismiss stale approvals when contracts, rules, migrations, scoring, or privacy-sensitive files change.
- Use small branches named `codex/<issue-id>-<short-name>`.
- A pull request declares user impact, change class, contract/data effects, screenshots, tests, rollout, and rollback.

### Required checks

| Check | Minimum contents |
|---|---|
| `quality-core` | install lockfile, lint, strict typecheck, unit tests, coverage, contract validation, production build |
| `firebase-emulator` | Auth, Firestore, Storage and Functions integration; Firestore and Storage rules; cross-user negative cases |
| `ui-e2e` | critical learner paths, loading/empty/error/retry states, keyboard, accessibility, 390 px and 1440 px viewports |
| `security` | secret scan, dependency review, default-deny rules, ownership, upload constraints, log redaction |
| `preview-smoke` | deploy preview, open app, sign in with test account, complete one activity, persist and reload progress |

Checks are enabled incrementally as their infrastructure lands. A check cannot be replaced by a comment saying it was run.

### GitHub environments

| Environment | Data | Deployment rule |
|---|---|---|
| local | emulator fixtures only | automatic |
| preview/staging | synthetic test accounts and content | PR preview after CI |
| production | real learner data | protected branch, required reviewer, manual promotion |

Use GitHub environment secrets only for environment-specific deployment identity. Runtime secrets belong in Google Cloud Secret Manager and are bound only to the Cloud Functions that need them.

## Firebase safety model

1. Create separate Firebase projects for development/staging and production.
2. Use the Local Emulator Suite for local and CI integration tests.
3. Start Firestore and Storage rules with default deny, then add the minimum ownership access.
4. Test anonymous, owner, other-user, moderator, malformed, oversized, and revoked-account cases.
5. Treat server/Admin SDK access as privileged because it bypasses Firestore Security Rules; enforce IAM and explicit use-case authorization in Functions.
6. Keep the Gemini API key server-side in Secret Manager. The browser receives only a typed application response.
7. Use App Check as an abuse-reduction layer, never as a replacement for authentication or authorization.
8. Put audio and image bytes in Cloud Storage; keep paths, hashes, content type, duration, ownership, consent, retention, and processing state in Firestore.
9. Make retryable Function operations idempotent with a stable attempt or command ID.
10. Log identifiers and operational metadata, not raw learner speech, private answers, tokens, or secrets.

Firebase Hosting pull request previews can call real backend resources. Therefore previews must target the staging project and synthetic data, never the production project.

## Change gates

| Change class | Additional gate |
|---|---|
| Lesson/content | schema validation, curriculum review, answer/rubric review, learner preview |
| Contract | compatibility reader, version increment, old fixture test |
| Firestore/index/rules | emulator tests, ownership negatives, expansion-first migration, recovery plan |
| Audio/media | type/size/duration validation, consent, retention/deletion, interrupted upload recovery |
| Prompt/model | versioned golden cases, safety, rubric agreement, latency, fallback and cost budget |
| Scoring/progression | deterministic tests, boundary cases, historical attempt replay, pilot owner approval |
| Privacy/security | threat review, redaction, deletion export test, Security approval |

## Definition of done

An issue is `DONE` only when:

- Acceptance criteria are demonstrated.
- Plan review and independent code review are approved.
- All risk-appropriate automated checks pass with no skipped required test.
- Preview evidence exists for user-facing behavior.
- Data compatibility and rollback are proven when relevant.
- No secret or production learner data appears in code, fixtures, logs, or previews.
- Monitoring and feature-flag behavior are confirmed for P1 and P2 work.
- Documentation, issue state, known risks, and follow-up work are updated.
- The result is merged through the protected branch and observed after release.

## Delivery roadmap

| Phase | Scope | Exit gate | Estimate |
|---|---|---|---|
| 0. Git baseline | initial reviewed commit, GitHub remote, issue/PR templates, branch protection | clean reproducible `main` and required current `verify` check | 1-2 days |
| 1. Agent scaffold | issue contract, labels, CODEOWNERS, PR template, application ports, split large UI modules | one P3 issue completes the whole loop | 4-6 days |
| 2. Firebase local foundation | config, emulator, Auth, Firestore, Storage, Functions, default-deny rules, test projects | emulator integration and ownership tests pass | 5-8 days |
| 3. Lesson runtime | repository adapters, immutable content versions, attempt envelope, resume state | A1 and B1 contract slices work after reload | 7-10 days |
| 4. Practice loop | listening, speaking, reading, writing attempts, audio upload, review scheduling, progress | idempotency, cross-user, offline/error and delayed-review paths pass | 7-10 days |
| 5. Pilot content | placement, 24 pilot lessons, content review workflow | curriculum and QA gates approve pilot | 10-15 days |
| 6. Gemini gateway | server-only provider, consent, redaction, fallback, golden tests, budgets | AI feature passes quality, privacy, latency and cost gates | 7-10 days |
| 7. Release hardening | preview CI, protected production environment, canary, monitoring, deletion/export and recovery drills | pilot release checklist and rollback drill pass | 7-10 days plus observation |

Estimates are planning ranges, not delivery promises. Each phase is split into issues that should normally complete within one to three working days.

## Verified execution baseline

As of 2026-08-30:

- Baseline commit `12532d0` is pushed to `Phoohats/English-Coach`.
- GitHub Actions run `33261970155` completed successfully with the `verify` check.
- Protected `main` requires pull requests, the current `verify` check, an up-to-date branch, and resolved conversations.
- Administrator bypass, force pushes, and branch deletion are disabled.
- Required approval is deferred only until an independent reviewer account exists; this avoids making a single-owner repository impossible to merge.
- ECC-001 is the first P3 issue exercising the complete protected pull-request loop.

## First execution sequence

1. Review the complete uncommitted repository and create the initial baseline commit.
2. Push to GitHub and protect `main` with the existing `Quality gates / verify` check.
3. Add issue and pull request templates, CODEOWNERS, labels, and protected environments.
4. Run one low-risk UI issue through the complete Agent loop to validate the process.
5. Add Firebase CLI configuration and Local Emulator Suite without connecting production.
6. Implement Auth plus a minimal learner profile behind ports, with owner and cross-user rules tests.
7. Add Firestore and Storage adapters for one A1 lesson attempt vertical slice.
8. Add Hosting pull request previews against staging synthetic data.
9. Proceed to the 24-lesson pilot only after the vertical slice passes every gate.

## Plan quality assessment

| Dimension | Score | Reason |
|---|---:|---|
| Architecture and change isolation | 9.7/10 | provider-independent core with explicit adapters and serialized contracts |
| Development completeness | 9.8/10 | covers plan, review, code, debug, test, release, observation, and update |
| GitHub/Firebase safety | 9.6/10 | protected main, emulator, staging previews, rules tests, secrets, canary and rollback |
| Multi-Agent coordination | 9.6/10 | one owner, explicit state machine, independent approvals, parallel boundaries |
| Current execution readiness | 9.6/10 for Phase 0 | baseline, remote CI, and protected `main` are verified; Firebase projects, emulator tests, and live preview remain Phase 2 gates |

The plan itself rates **9.7/10**. The product does not inherit that rating until Phase 0-2 evidence exists; readiness must be raised by implementation and verification rather than documentation alone.

## External basis

- [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub deployment environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [Firebase Hosting GitHub integration](https://firebase.google.com/docs/hosting/github-integration)
- [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Firestore Security Rules testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Security Rules management](https://firebase.google.com/docs/rules)
- [Cloud Functions configuration and secrets](https://firebase.google.com/docs/functions/config-env)
