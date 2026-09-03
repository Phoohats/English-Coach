# Core Architecture

## Boundary

The core is a TypeScript modular monolith. It owns contracts and policies that must remain stable while UI, storage, authentication, and external AI adapters are added later.

## Modules

| Module | Owns | Must not own |
|---|---|---|
| contracts | lesson and attempt types | rendering or persistence |
| validation | JSON Schema and cross-field rules | business side effects |
| feature flags | fail-closed release switches | remote flag vendor logic |
| AI boundary | provider interface and fallback behavior | Gemini credentials or network calls |
| persistence policy | compatible migration and ownership rules | Firebase SDK or storage implementation details |

Dependencies point inward: applications may import core modules, while core, contracts, and application ports may not import React, Firebase, browser, or provider implementations. Firebase SDK usage is confined to adapters and bootstrap code.

## Stability rules

- Published lesson content is immutable and receives a new semantic version when changed.
- Every assessed attempt pins lesson, activity, objective, rubric, schema, and any AI execution versions.
- Unknown feature flags fail closed.
- AI failure returns a declared fallback without discarding the learner attempt.
- Contract validation occurs before content publication and before attempt persistence.
- Breaking contract changes require a new schema major version and a compatibility reader during migration.

## Selected adapter boundary

Firebase is the selected persistence and authentication platform for the modular monolith. Firestore stores structured, versioned records; Cloud Storage stores media bytes; Authentication supplies user identity; and Functions v2 owns privileged or external-provider operations.

Provider-neutral contracts use ordinary TypeScript values such as ISO-8601 timestamps. Firebase adapters alone convert those values to and from provider types such as Firestore `Timestamp` and server timestamp sentinels. The Local Emulator Suite and a `demo-` project ID are mandatory before any remote project is connected.

Learner IDs remain opaque in the shared contract and contain 1-128 UTF-16 code units, matching the enforceable Firestore Rules length boundary. Because `/` is a Firestore document-path concern rather than a domain invariant, only the Firebase adapter rejects it before constructing a document reference. Provider adapters use dedicated entry points under `src/adapters/` and are not exported by the core barrel.

## Deferred product adapters

- Web/PWA lesson player.
- Production Firebase project bootstrap and remote authentication.
- Firestore repositories beyond the learner-profile vertical slice.
- Cloud Storage upload flows for audio and images.
- Gemini provider implementation.
- Analytics and remote feature-flag provider.

These adapters remain outside the core so learning policy can be tested without network, credentials, or infrastructure.
