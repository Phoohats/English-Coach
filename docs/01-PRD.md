# Product Requirements Document

## 1. Product statement

English Career Coach is a mobile-first learning application that helps Thai speakers progress from beginner English to professional fluency. It combines structured CEFR-aligned lessons with adaptive review and career-focused AI roleplay.

The product must serve two needs without becoming two separate applications:

1. A beginner can start at A1 with Thai guidance, visual context, and controlled language.
2. An intermediate learner can enter through placement and focus on interviews, work communication, and a B1-C1 progression path.

## 2. Initial users

### Beginner learner

- Thai speaker at pre-A1 or A1.
- Needs clear instructions and low-pressure speaking practice.
- May not understand English-only explanations.
- Primarily uses a mobile phone.

### Career improver

- Thai speaker around B1-B2.
- Needs job interviews, meetings, presentations, and professional writing.
- Wants measurable feedback instead of generic conversation practice.
- May provide a CV and job description containing personal information.

### Curriculum administrator

- Creates and versions objectives, lessons, answer keys, rubrics, and media.
- Reviews AI-generated content before it becomes reusable course content.
- Monitors failed items, learner confusion, and unfair scoring.

## 3. Product goals

- Build measurable competence across listening, speaking, reading, and writing.
- Recommend the next lesson from demonstrated mastery and review needs.
- Make beginner lessons understandable without overusing translation.
- Connect intermediate and advanced learning to real career outcomes.
- Keep assessed answers deterministic whenever a single correct answer exists.
- Let learners see why an answer needs improvement and how to retry it.

## 4. Non-goals for the pilot

- Live tutoring marketplace.
- Social feed, public leaderboard, or competitive streak system.
- Full A1-C1 content library at launch.
- High-stakes certification or claims that the app officially awards CEFR levels.
- Automatic rejection of a pronunciation attempt based only on accent similarity.
- AI-generated answer keys without human approval.

## 5. Critical user journeys

### First-time beginner

1. Selects goal and self-reported experience.
2. Completes a short, low-anxiety diagnostic or chooses Start from A1.
3. Receives an A1 lesson with Thai instructions and visual context.
4. Listens before viewing the full transcript.
5. Speaks, reads, writes, and receives actionable feedback.
6. Completes an exit ticket and sees the next recommended action.

### Career learner

1. Selects job-interview or career goal.
2. Completes placement across all four skills.
3. Optionally provides a CV and job description with explicit consent.
4. Practices a structured answer, then an unprepared follow-up.
5. Receives feedback on meaning, structure, language, fluency, and evidence.
6. Saves an improved answer and receives targeted review items.

### Returning learner

1. Opens a short due-review queue.
2. Continues the recommended lesson or selects a goal-specific practice.
3. Sees progress by competency, not only completed lesson count.

## 6. Functional requirements

### P0: required for the pilot

- Account, profile, native language, goal, and target role.
- Start-from-A1 option and four-skill placement route.
- Versioned course, unit, lesson, activity, objective, and rubric data.
- Listening, speaking, reading, writing, roleplay, and review activities.
- Audio recording with consent, retry, timeout, and fallback states.
- Deterministic scoring for closed questions.
- Rubric scoring plus evidence for open speaking and writing tasks.
- Error tagging and spaced review queue.
- Progress by skill and learning objective.
- AI provider gateway with prompt version, timeout, retry, cost, and fallback logging.
- Admin review state: draft, reviewed, published, retired.
- Mobile accessibility and keyboard-accessible desktop behavior.

### P1: after the pilot validates demand

- CV and job-description ingestion.
- Personalized interview question sets.
- Multiple interviewer styles and follow-up strategies.
- Downloadable answer bank and progress report.
- Offline review packs.
- Additional languages and localized explanations.

## 7. Learning requirements

- Every lesson has one to three observable `can-do` objectives.
- Every assessed activity references at least one objective.
- Skill weights total 100 percent for every lesson.
- A lesson may emphasize one skill but must include meaningful transfer to at least two others.
- Each unit contains all four skills and at least one integrated performance task.
- Promotion requires mastery evidence and a delayed check, not completion alone.
- Feedback follows: observation, reason, improved model, retry.
- Beginner instructions may use Thai; target-language exposure increases by level.
- Every lesson declares a provisional first-pass difficulty window and an ordered support-fading path.
- Fluency feedback waits until the learner finishes the turn and focuses on no more than two points.
- Review uses active retrieval, increasing pilot intervals, adaptive resets, and a changed transfer context.
- Every lesson includes a meaningful learner choice, a visible competence signal, and a reflection prompt.
- Every unit includes interaction, mediation, or collaboration rather than production alone.
- Mastery thresholds remain provisional until independent attempts and delayed transfer outcomes are calibrated.

## 8. AI policy

AI may:

- Generate controlled variants from approved vocabulary and grammar.
- Conduct bounded roleplay and ask follow-up questions.
- Explain errors in Thai at the learner's selected depth.
- Suggest an improved answer while preserving the learner's intended meaning.
- Produce draft images and voice assets for human review.

AI may not:

- Change level objectives, pass thresholds, or answer keys during an attempt.
- Claim an official CEFR certification result.
- Infer protected traits or use them in scoring.
- Penalize accent difference when speech remains intelligible.
- expose CV, job-description, audio, or transcript data to another learner.

## 9. Data and privacy

- Store the minimum personal data needed for learning.
- Obtain explicit consent before recording or retaining voice.
- Let the learner delete recordings, transcripts, CV data, and account data.
- Separate raw media retention from derived learning metrics.
- Do not use learner content for model training by default.
- Redact personal identifiers from operational logs.
- Record model, prompt version, rubric version, latency, and failure reason for AI assessments.
- Use only synthetic or intentionally public test content with unpaid AI services.
- Route CVs, voice, transcripts, and other learner personal data only through a billing-enabled paid Gemini project whose data and logging configuration has passed the production privacy checklist.
- Keep Gemini API logging disabled unless a documented operational need is approved, and never opt learner logs into shared datasets or model-improvement feedback.

Gemini's current terms state that content sent through unpaid services may be used to improve Google products and may be reviewed by humans; they explicitly advise against sending personal, sensitive, or confidential information. Paid-service prompts and responses are not used for product improvement under the paid-service terms, but logging and abuse-monitoring behavior still require configuration and verification. Sources: [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms) and [Gemini API data logging](https://ai.google.dev/gemini-api/docs/logs-policy).

## 10. Pilot release scope

- 12 A1 lessons: introductions and daily routines.
- 12 B1-B2 career lessons: professional introductions and behavioral interviews.
- One placement prototype covering listening, speaking, reading, and writing.
- One adaptive review queue.
- One curriculum administration workflow.

## 11. Success and guardrail metrics

These are proposed pilot gates, not external benchmarks:

- At least 70 percent of pilot learners complete their first lesson.
- At least 60 percent complete three learning sessions in seven days.
- At least 75 percent of rated feedback is marked understandable and useful.
- Delayed review performance improves over the learner's first attempt.
- Learners succeed on a changed transfer task rather than only repeating the practiced prompt.
- Speaking and writing scores reach acceptable human-rater agreement before automated scores affect promotion.
- At least 95 percent of published activities have objective and rubric traceability.
- Fewer than 2 percent of AI turns violate the lesson's allowed language or task boundary.
- No confirmed cross-user data exposure or loss of an assessed attempt.

## 12. Release acceptance

Coding may begin when the PRD, curriculum map, lesson schema, sample lessons, and pre-code QA review have no open P1 findings. Pilot release remains blocked until privacy controls, deterministic score tests, AI fallback tests, and mobile critical paths pass.

Core product coding may use mocked AI responses. Sending real learner data to Gemini remains blocked until the paid-project, logging, consent, retention, and deletion controls have been verified in the live environment.
