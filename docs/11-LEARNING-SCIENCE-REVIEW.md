# Learning Science Review

## Decision

**Design review: GO for a limited A1 and B1-B2 pilot.**

The curriculum core now represents reception, production, interaction, mediation, learning strategies, adaptive retrieval, support fading, selective feedback, learner choice, delayed checks, and changed-context transfer. It is not yet approved to claim CEFR certification, proven learning effectiveness, or calibrated automated promotion.

## Rating

| Dimension | Previous | Current | Evidence in the design |
|---|---:|---:|---|
| CEFR and action-oriented tasks | 8.7 | 9.4 | Can-do outcomes cover reception, production, interaction, mediation, and strategies |
| Input and cognitive-load control | 8.2 | 9.1 | First-pass check, ordered supports, and support fading are explicit |
| Retrieval and spacing | 7.4 | 9.3 | Versioned adaptive scheduler includes lapses, delayed checks, and varied-context review |
| Interaction and repair | 9.1 | 9.4 | Goal-oriented roleplay requires clarification, repair, and independent turns |
| Corrective feedback | 7.9 | 9.3 | Timing differs for fluency and accuracy; feedback is prioritized and capped at two points |
| Motivation and self-regulation | 7.2 | 8.9 | Meaningful choice, competence evidence, reflection, and optional relatedness are contracted |
| Transfer to real work | 9.2 | 9.5 | Interview tasks preserve learner facts and require changed audience or situation |
| Assessment validity | 6.8 | 8.8 | Thresholds are provisional; promotion requires independent samples, delayed checks, and human calibration |

**Overall design rating: 9.2/10.**

The rating is intentionally below 9.5 because architecture and lesson design cannot establish learning effectiveness by themselves. A score above 9.5 requires pilot evidence of delayed retention, changed-context transfer, acceptable human-rater agreement, fair speech evaluation, and tolerable learner workload.

## Regression Review

- Lesson, attempt, rubric, prompt, model, and scheduler versions remain pinned.
- Review history is not reinterpreted when scheduler defaults change.
- Risky capabilities remain behind feature flags and real AI is still outside the core.
- Lesson examples validate against the expanded schema.
- Invalid mediation payloads, inverted difficulty windows, and non-increasing review intervals fail closed.
- Pure policy functions are deterministic and covered by regression tests.

## Remaining Gates

1. Run the A1 and B1-B2 pilot defined in `docs/10-PILOT-EVALUATION.md`.
2. Test immediate learning, delayed retention, and changed-context transfer separately.
3. Use two trained human raters for sampled speaking and writing responses.
4. Calibrate thresholds and review intervals from learner data; retain version history.
5. Audit Thai-accented intelligibility, device conditions, privacy, deletion, and AI cost before wider release.

## Verification Snapshot

- ESLint: passed.
- Strict TypeScript: passed.
- Automated tests: 36 passed across 6 files.
- Coverage: 100% lines, 100% functions, 83.07% branches, 90.05% statements.
- Contract examples: A1 lesson, B1 lesson, and attempt envelope passed.
- Dependency audit: zero known vulnerabilities at the configured audit level.
