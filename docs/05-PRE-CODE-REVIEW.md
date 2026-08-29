# Pre-Code Review Report

## 1. Summary

Decision: **Conditional GO for core prototype coding.**

The requirements, curriculum model, base lesson contract, and two vertical-slice lessons are coherent enough to begin the mocked-AI foundation. Real learner data must not be sent to Gemini until the paid-project privacy gate is verified. Full A1-C1 content production remains out of scope for the pilot.

## 2. User lens

### Beginner learner

- Confirmed: a learner may explicitly start from A1 rather than being forced through a stressful placement test.
- Confirmed: A1 instructions support Thai without placing translations inside the answer itself.
- Confirmed: the sample uses image context, listening, speaking, reading, writing, roleplay, and recall.
- Confirmed: microphone denial has a declared typed alternative.
- Needs live verification: instruction clarity, image ambiguity, recording usability, and feedback usefulness on a real phone.

### Career learner

- Confirmed: the B1 sample measures relevance and evidence before grammar polish.
- Confirmed: a fluent but irrelevant answer cannot reach the 75 percent pass threshold.
- Confirmed: the sample moves from model analysis to outline, spoken answer, follow-up, revision, and final retrieval.
- Needs live verification: whether 25-27 minutes feels sustainable and whether AI follow-ups remain natural and role-relevant.

## 3. Engineer lens

- Confirmed: lessons, objectives, activities, rubrics, and prompts are versioned.
- Confirmed: closed tasks can use deterministic scoring and open tasks use explicit rubrics.
- Confirmed: every assessed activity traces to declared objectives.
- Confirmed: AI behavior has allowed actions, forbidden actions, and a non-AI fallback.
- Confirmed: privacy and deletion requirements are present in the PRD.
- Needs implementation: type-specific activity content validators, attempt idempotency, ownership checks, and curriculum graph validation.
- Needs live verification: Gemini billing tier, project logging, dataset-sharing controls, provider retention, and deletion behavior.

## 4. Issues found

| Finding | Priority | Status | Resolution |
|---|---:|---|---|
| Activity and objective versions promised by the contract were absent from the schema | P1 | Already fixed | Added semantic versions to schema and both samples |
| Declared skill weights did not closely represent sample activity time | P2 | Already fixed | Rebalanced weights and added a 10-point drift check |
| Base JSON Schema cannot enforce weight totals or objective references | P2 | Confirmed, mitigated | Added mandatory publishing-validator rules to the contract and QA plan |
| Activity `content` shapes are not yet discriminated by type | P2 | Confirmed | Each activity type must receive its own validator before implementation/publishing |
| Gemini unpaid services are unsuitable for CV, voice, or personal transcript data | P1 | Mitigated, needs live verification | Synthetic data only for unpaid tests; paid project and privacy configuration gate for real data |
| Speech-score fairness cannot be established from schema review | P2 | Needs live verification | Pilot calibration across varied Thai accents and human-audited samples |

## 5. Checks run

- AJV Draft 2020-12 validation: both sample lessons valid.
- Required contract sections: passed for both samples.
- Skill weights total 100: passed.
- Objective reference integrity: passed.
- Identifier uniqueness: passed.
- Rubric total and threshold integrity: passed.
- Four-skill activity coverage: passed.
- AI boundaries and fallback: passed.
- Transcript, image-alt, and non-audio policy: passed.
- Lesson, objective, activity, rubric, and prompt versioning: passed.
- Declared skill weights versus activity-time share: maximum drift 4.1 points for A1 and 4.6 points for B1.
- Declared duration versus activity duration: 8.3 percent drift for A1 and 8.0 percent for B1.

Static result: **26 checks passed**: two AJV sample validations plus 24 cross-field checks.

## 6. Required implementation guardrails

1. Begin with mocked AI and deterministic sample media.
2. Implement the lesson publisher and cross-field validation before the lesson player accepts arbitrary content.
3. Add type-specific validation at the same time each activity renderer is introduced.
4. Store idempotency keys and immutable content versions with every assessed attempt.
5. Keep CV ingestion out of the first pilot unless paid Gemini privacy configuration is verified.
6. Treat placement level as an estimate until calibrated against learner performance.

## 7. Regression tests required during coding

- Reject a lesson whose skill or rubric weights do not total 100.
- Reject an activity referencing an unknown objective.
- Preserve an attempt when an AI call times out or a microphone permission is denied.
- Prevent duplicate submissions from awarding progress twice.
- Ensure one learner cannot access another learner's recording, transcript, CV, or feedback.
- Verify published lesson updates create a new version and do not change historical scores.
- Verify an irrelevant but grammatically strong interview answer fails task completion.
- Verify intelligible Thai-accented speech is not failed solely for accent difference.

## 8. Final recommendation

**GO:** build the core mobile lesson prototype, curriculum publisher, deterministic scoring, progress model, and AI adapter using mocked responses.

**NO-GO:** real CV/voice/transcript transmission to Gemini, production AI scoring, public pilot launch, or mass production of the 240-lesson roadmap until their respective live gates pass.
