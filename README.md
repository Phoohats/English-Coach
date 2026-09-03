# English Career Coach

Planning workspace for an adaptive English-learning product covering CEFR A1-C1.

## Current status

**Core foundation plus interactive UI prototype.** The repository contains versioned contracts, deterministic validation, feature flags, a mocked AI boundary, local-only Firebase emulators, regression tests, CI quality gates, and six responsive learning views.

## Product direction

- General English path for beginners starting at A1.
- Career English path for learners around B1-C1.
- Shared adaptive learning engine for listening, speaking, reading, and writing.
- Human-controlled objectives, answer keys, rubrics, and progression.
- Gemini-compatible AI gateway for roleplay, feedback, images, and voice assets.

## Documents

- `docs/01-PRD.md` - product requirements and acceptance criteria.
- `docs/02-CURRICULUM-MAP.md` - A1-C1 scope, competencies, and progression.
- `docs/03-LESSON-CONTRACT.md` - lesson structure and AI boundaries.
- `docs/04-PRE-CODE-QA-PLAN.md` - pre-coding review and GO/NO-GO gates.
- `docs/06-CORE-ARCHITECTURE.md` - stable module boundaries and versioning rules.
- `docs/07-DELIVERY-PIPELINE.md` - change gates, release flow, and rollback policy.
- `docs/08-CORE-QA-REPORT.md` - verified checks, fixed findings, and remaining live gates.
- `docs/09-LEARNING-SCIENCE-POLICY.md` - evidence-backed learning controls and provisional pilot defaults.
- `docs/10-PILOT-EVALUATION.md` - pre, immediate, delayed, transfer, and calibration protocol.
- `docs/11-LEARNING-SCIENCE-REVIEW.md` - post-change curriculum review, ratings, and remaining evidence gates.
- `docs/12-UI-PROTOTYPE-REVIEW.md` - six-view UX mapping, interaction coverage, and responsive review.
- `docs/13-DESIGN-DECISION.md` - selected Quiet Editorial direction and application rules.
- `docs/14-AGENT-DEVELOPMENT-LOOP.md` - multi-Agent planning, review, coding, debugging, testing, Firebase, and release loop.
- `docs/15-ECC-002-FIREBASE-FOUNDATION.md` - local Firebase runtime, security boundaries, verification, and rollback.
- `spec/lesson.schema.json` - machine-readable lesson contract.
- `spec/attempt.schema.json` - version-pinned attempt envelope.
- `examples/a1-introduction.lesson.json` - beginner lesson vertical slice.
- `examples/b1-career-introduction.lesson.json` - career lesson vertical slice.

## Proposed first release

The pilot contains 24 lessons:

- 12 A1 lessons covering introductions and daily routines.
- 12 B1-B2 career lessons covering professional introductions and behavioral interviews.

Expansion to the full A1-C1 roadmap is conditional on pilot learning outcomes, completion, retention, content quality, and AI cost.

## Core verification

```bash
npm install
npm run verify
```

`npm run verify` runs repository security checks, lint, strict TypeScript checks, regression tests with coverage thresholds, contract validation, dependency audit, and a production build. Risky features remain disabled by default; Firebase access is emulator-only and no real AI connection is present.

## Firebase emulator verification

Install the pinned Node 22 runtime and Functions dependencies after the root install:

```bash
npm --prefix tools/node22 ci
npm run install:functions
npm run test:firebase
npm run test:firebase:lifecycle
```

Java 21 is required by the Firestore emulator. These commands use only the `demo-english-career-coach` project and loopback addresses.

## UI prototype

```bash
npm run dev
```

The prototype includes Today, Learn, Speak, Write, Review, and Progress views. It uses contract-aligned mock data and the deterministic difficulty, feedback, and review policies; microphone, persistence, and AI calls remain mocked.

### Six design directions

Open `http://127.0.0.1:5173/?mockups=1` to compare six full-screen UI directions: Focus Garden, Career Desk, Bright Steps, Quiet Editorial, Coach Conversation, and Skill Compass. The selector keeps the chosen concept in the URL for direct review.
