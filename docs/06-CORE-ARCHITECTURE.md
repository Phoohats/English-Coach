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
| database policy | compatible migration rules | a database provider before one is selected |

Dependencies point inward: future applications may import core modules, while core modules may not import frontend, database, or provider implementations.

## Stability rules

- Published lesson content is immutable and receives a new semantic version when changed.
- Every assessed attempt pins lesson, activity, objective, rubric, schema, and any AI execution versions.
- Unknown feature flags fail closed.
- AI failure returns a declared fallback without discarding the learner attempt.
- Contract validation occurs before content publication and before attempt persistence.
- Breaking contract changes require a new schema major version and a compatibility reader during migration.

## Deferred adapters

- Web/PWA lesson player.
- Authentication and user ownership.
- PostgreSQL repository.
- Object storage for audio and images.
- Gemini provider implementation.
- Analytics and remote feature-flag provider.

These adapters are intentionally absent so the core can be tested without network, credentials, or infrastructure.
