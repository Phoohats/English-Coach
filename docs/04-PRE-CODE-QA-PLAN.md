# Pre-Code QA Plan

## 1. Target and environment

Target: product requirements, A1-C1 curriculum logic, lesson data contract, and two sample lesson vertical slices.

Environment: documentation and JSON specifications only. No frontend, API, database, AI provider, or deployed environment exists yet.

User roles reviewed: beginner learner, career learner, curriculum administrator, and system operator.

## 2. Severity model

| Priority | Meaning before coding |
|---|---|
| P1 | Invalid learning logic, privacy/security gap, unusable critical journey, or schema that cannot represent a required behavior |
| P2 | Important ambiguity likely to cause rework or inconsistent implementation |
| P3 | Wording, completeness, maintainability, or future optimization issue |

## 3. Static checks

| Test ID | Check | Pass condition |
|---|---|---|
| PRE-001 | JSON parsing | Schema and examples parse without errors |
| PRE-002 | Required lesson fields | Both examples include all required contract sections |
| PRE-003 | Skill weights | Every sample totals exactly 100 |
| PRE-004 | Objective traceability | Every activity references an objective declared in its lesson |
| PRE-005 | Unique identifiers | Lesson activity and objective IDs are unique |
| PRE-006 | Rubric integrity | Criterion weights total 100 and pass threshold is within 0-100 |
| PRE-007 | Four-skill coverage | Each sample includes listening, speaking, reading, and writing |
| PRE-008 | AI boundary | Each sample declares allowed actions, forbidden actions, and fallback |
| PRE-009 | Accessibility | Audio has transcript or alternative; images have meaningful alt text |
| PRE-010 | Versionability | Lesson, rubric, and prompt versions are represented |
| PRE-011 | Skill-time alignment | Declared lesson skill weights are within 10 percentage points of activity-time share |
| PRE-012 | Lesson duration alignment | Activity duration total is within 15 percent of declared lesson duration |
| PRE-013 | Nested versionability | Every objective and activity has a semantic version |
| PRE-014 | Difficulty window | Lower first-pass bound is below the upper bound |
| PRE-015 | Feedback load | Fluency feedback is after-turn and limited to two focus points |
| PRE-016 | Review progression | Intervals increase, retrieval is required, and transfer variation is enabled |
| PRE-017 | Learner agency | Every lesson has meaningful choice, competence signal, reflection, and relatedness option |
| PRE-018 | Calibration honesty | Threshold is marked provisional until human and delayed evidence exists |
| PRE-019 | Mediation integrity | Mediation content declares source, audience, required points, and output limit |

## 4. User-lens scenario reviews

| Test ID | Scenario | Expected result |
|---|---|---|
| UX-001 | Pre-A1 learner cannot understand the English instruction | Thai support can be shown without revealing the answer |
| UX-002 | Learner denies microphone permission | A text or listen-only alternative is offered and progress is preserved |
| UX-003 | Learner fails a speaking attempt repeatedly | Feedback changes strategy and offers a smaller guided step |
| UX-004 | B1 learner gives a memorized but irrelevant answer | Task-completion score remains low despite grammatical accuracy |
| UX-005 | Learner returns after several days | Due review appears before or alongside the next lesson |
| UX-006 | AI is slow or unavailable | The lesson uses its fallback and does not lose the attempt |
| UX-007 | Learner deletes voice data | Raw recording is removed without corrupting allowed aggregate progress |

## 5. Engineer-lens design reviews

| Test ID | Risk | Required design evidence |
|---|---|---|
| ENG-001 | Published content changes historical scoring | Immutable version IDs on lessons, activities, rubrics, and attempts |
| ENG-002 | AI result cannot be reproduced or audited | Model, prompt, rubric, latency, fallback, and request correlation metadata |
| ENG-003 | Cross-user private data exposure | Tenant/user ownership checks on every private resource |
| ENG-004 | Duplicate submissions create double progress | Idempotency key for assessed attempts |
| ENG-005 | Cost grows unpredictably | Per-feature token/media limits, caching, and cost telemetry |
| ENG-006 | Accent bias creates false failures | Intelligibility rubric, retry evidence, and human-audit sample |
| ENG-007 | Curriculum graph produces a dead end | Prerequisite cycle and reachability validation |
| ENG-008 | Personal data is sent under unsafe Gemini terms | Paid billing-enabled project, logging review, no dataset sharing, synthetic-only unpaid tests |

## 6. GO/NO-GO before coding

GO requires:

- No open P1 issue.
- All PRE checks pass.
- Critical journeys have acceptance criteria and fallback states.
- Pilot scope remains 24 lessons rather than full A1-C1 production.
- Privacy decisions for voice, CV, transcript retention, and deletion are approved.
- Real learner data remains blocked from Gemini until ENG-008 is verified against the live project configuration.
- Placement is described as an estimate until calibrated with learner data.

NO-GO conditions:

- AI is permitted to invent pass criteria or answer keys.
- Voice or CV data retention has no consent and deletion design.
- Lesson data cannot trace an assessment back to its objective and rubric version.
- The team commits to producing all 240 roadmap lessons before a pilot.

## 7. Checks deferred until software exists

- Responsive layout, accessibility tree, browser and device testing.
- Authentication, authorization, tenant isolation, and deletion execution.
- API timeout, retry, rate-limit, and idempotency behavior.
- Database migration, consistency, concurrency, and backup restoration.
- AI latency, cost, prompt injection resistance, and provider failure.
- Audio quality, recording compatibility, and speech-score fairness calibration.
