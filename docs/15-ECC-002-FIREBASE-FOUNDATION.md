# ECC-002 Firebase Local Foundation

## Status

The local backend foundation uses `demo-english-career-coach`, binds emulators to `127.0.0.1`, carries no release command or production project, and strips non-allowlisted environment variables before emulator children start.

## Runtime topology

- Root quality gates run on Node 24 and fail when invoked through another major version.
- The pinned Node 22.23.2 binary lives in the isolated `tools/node22` package.
- Functions dependencies, builds, emulator Functions, and emulator test children run with the pinned Node 22 binary.
- Firebase CLI 15.29.0, Functions 7.3.2, Admin 14.3.0, and client SDK 12.18.0 are lockfile-pinned.
- Firebase emulator binaries use one cache under `node_modules/.cache/firebase/emulators` across all invocations in a job.
- Functions discovery has a bounded 30-second startup budget to absorb cold Windows/CI filesystem scans without retrying source-load failures.

## Learner profile slice

The application contract uses ISO-8601 UTC strings and the Firebase adapter alone converts Firestore `Timestamp` values. Learner user IDs contain 1-128 UTF-16 code units. The shared contract keeps IDs provider-neutral; the Firebase adapter alone rejects `/` before using an ID as a Firestore document path.

Firestore stores exactly six fields under `/learnerProfiles/{uid}`. Owners may create, get, and update mutable fields. Schema version, user ID, and creation timestamp are immutable. List, delete, cross-user access, anonymous access, and unmatched paths are denied. Cloud Storage is default-deny for every identity and operation.

## Verification

From a fresh clone, install root dependencies with Node 24, install the isolated runtime, and install Functions dependencies before starting the emulators. Java 21 must be available:

```bash
npm ci --ignore-scripts
npm --prefix tools/node22 ci
npm run install:functions
npm run verify
npm run test:firebase
npm run test:firebase:lifecycle
```

- `npm run verify`: Node 24 assertion, lint, strict typecheck, unit tests, coverage thresholds, contract validation, dependency-free secret scan, repository policy, controlled dependency audit, and production build.
- `npm run test:firebase`: Auth, Firestore Rules, real Firebase repository, Storage, and Functions emulator tests, including UTF-16 boundary cases.
- `npm run test:firebase:lifecycle`: success propagation, executed failure marker, credential isolation, and closed-port checks. The shared runner checks every configured emulator port plus the Functions worker ports recorded by Firebase before startup and after every shutdown.
- The runner samples emulator descendants, retains each process creation identity, revalidates identity before termination, and defers sampling errors until cleanup and port verification have run.
- Functions installation uses an explicit environment allowlist, isolated npm configuration, disabled dependency lifecycle scripts, a child-process secret canary, and exact Node 22.23.2 verification.
- GitHub runs dependency-free secret and local-only project/deploy policy checks immediately after checkout and before dependency installation or repository code. Jobs disable persisted checkout credentials, isolate Cloud SDK configuration, clear remote credential paths, pin project variables to the demo ID, and make the required `verify` context aggregate every core, Firebase, audit, and dependency-review job.
- `npm run audit:security`: rejects every moderate-or-higher advisory except one explicit temporary transitive exception. Patched `qs` and `uuid` versions are enforced through lockfile overrides.

## Temporary advisory exceptions

The exception expires on 2026-12-01. CI fails after that date, if severity increases, if the dependency becomes direct, if product code imports it through any static, dynamic, CommonJS, type, or subpath form, or if its exact CLI-only dependency path changes.

| Advisory | Package | Scope | Rationale |
|---|---|---|---|
| GHSA-8988-4f7v-96qf | `@opentelemetry/core` | root Firebase CLI tooling | Product runtime does not import the CLI-only Pub/Sub telemetry path |

Dependency Review fails on new moderate advisories and allowlists only this GHSA identifier.

## Rollback order

1. Revert the ECC-002 application, rules, Functions, tooling, and workflow commit together; the required `verify` job name remains stable across the revert.
2. Run the existing `verify` gate on the reverted branch.
3. Do not deploy, delete production data, or change a remote Firebase project during this rollback.
