# Lesson Contract

## Purpose

The lesson contract prevents curriculum logic from being embedded directly in screens or AI prompts. A published lesson is immutable; corrections create a new version so that historical attempts remain interpretable.

The machine-readable draft is in `spec/lesson.schema.json`.

## Required lesson sections

| Section | Purpose |
|---|---|
| identity | stable ID, version, level, unit, title, status |
| timing | target duration and activity estimates |
| skill weights | intended listening, speaking, reading, writing, and review balance |
| objectives | observable can-do statements and mastery thresholds |
| language scope | allowed vocabulary, chunks, grammar, and Thai support policy |
| difficulty policy | provisional first-pass window, support order, and fading rule |
| feedback policy | timing, priority, focus limit, and retry rule |
| review policy | versioned intervals, retrieval, adaptation, and transfer variation |
| learner agency | meaningful choice, competence signal, reflection, and relatedness option |
| activities | ordered learner interactions with objective references |
| assessment | scoring model, rubric, pass threshold, and retry behavior |
| AI policy | allowed generation, forbidden behavior, and fallback |
| accessibility | transcript, alt text, captions, and non-audio alternatives |

## Activity contract

Every activity contains:

- Stable activity ID unique within the lesson.
- Semantic activity version for attempt history and reusable-content updates.
- Type from the approved activity registry.
- One primary skill.
- Estimated duration.
- Instruction in English and optional Thai.
- References to one or more lesson objectives.
- Content and answer data appropriate to the activity type.
- Feedback mode and retry policy.

Each activity type must have a type-specific content validator before that activity can be published. The base schema intentionally permits different content shapes, while the publishing validator enforces fields such as answer choices, transcripts, response limits, and roleplay boundaries.

Approved pilot activity types:

- `scene_observe`
- `listen_choose`
- `listen_order`
- `speak_repeat`
- `speak_response`
- `read_match`
- `read_infer`
- `write_fill`
- `write_response`
- `mediate_information`
- `roleplay`
- `review_recall`
- `exit_ticket`

## Scoring contract

- Closed activities use deterministic answer keys.
- Open activities use a versioned rubric and return evidence for each score.
- Pronunciation focuses on intelligibility, target sound issues, omissions, and rhythm. Accent similarity alone cannot fail a learner.
- AI output never changes the pass threshold during an attempt.
- An unavailable AI service triggers the declared fallback instead of losing progress.
- Scores store lesson version, activity version, rubric version, and model metadata.
- The publishing validator enforces cross-field rules that JSON Schema cannot express directly: skill weights total 100, criterion weights total 100, objective references exist, identifiers are unique, and planned skill balance is reasonably aligned with activity time.
- Provisional pass thresholds cannot be presented as calibrated CEFR decisions.
- Promotion requires the configured minimum independent samples and a delayed transfer check.

## Feedback contract

- Fluency activities collect observations during the turn and present feedback after the learner finishes.
- Accuracy activities may respond after the attempt, but never interrupt a recording mid-utterance.
- Select at most two focus points in this order: task, intelligibility, target language, minor accuracy.
- Feedback follows observation, reason, model, and retry while preserving the learner's intended meaning.
- A retry receives a changed cue only when the target competency remains the same.

## Review contract

An incorrect or weak attempt creates one or more `ErrorTag` records. A review item links the error to a competency, source activity, approved prompt template, scheduler version, stage, lapse count, and due date. Review must require retrieval and vary the surface form while preserving the same target skill.

The initial intervals are pilot defaults, not universal learning constants. A failed retrieval resets to the short interval, a hard retrieval moves back, and successful retrieval expands the interval. Interval changes require a scheduler version and pilot evidence.

## Difficulty and agency contract

- The lower and upper first-pass accuracy bounds are provisional and must be calibrated by level and activity family.
- Support steps are explicit and ordered so the interface can reveal and fade them predictably.
- High performance on one attempt is insufficient to remove support or increase challenge.
- Each lesson provides at least one bounded, personally relevant choice.
- Competence is communicated through a can-do performance; reflection names strategy or evidence.
- Relatedness options never force public sharing and remain optional for the learner.

## Versioning rules

- Draft lessons may change freely.
- Reviewed lessons require a change note.
- Published lessons are immutable.
- A correction creates a new semantic version.
- Existing attempts continue to reference the exact version presented.
- Retired lessons remain readable for audit but are not assigned again.
