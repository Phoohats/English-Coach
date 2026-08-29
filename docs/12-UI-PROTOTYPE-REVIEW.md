# UI Prototype Review

## Scope

The responsive prototype covers six connected views:

| View | Learner job | Learning-core mapping |
|---|---|---|
| Today | Know what to do next without planning overhead | Can-do objective, balanced difficulty, due retrieval |
| Learn | Understand a meaningful model with optional support | First-pass comprehension, ordered support, support fading |
| Speak | Rehearse a realistic interview turn | Interaction, intelligibility, post-turn feedback, retry |
| Write | Build an accurate career story | Mediation, fact preservation, selective feedback |
| Review | Retrieve skills in a changed context | Versioned adaptive scheduler, lapse handling, transfer |
| Progress | See credible evidence of improvement | Four-skill balance, independent samples, delayed checks |

## UX Decisions

- Navigation is stable across all views, with a mobile bottom bar and desktop sidebar.
- The primary action is visible without turning the app into a marketing page.
- Progress language emphasizes evidence and independence rather than streak pressure.
- Thai support and transcript controls are optional and learner-triggered.
- Speaking feedback waits until the turn ends and shows at most two priorities.
- Writing feedback preserves learner facts and marks missing evidence explicitly.
- Level estimates are labelled provisional until delayed and human-rated checks exist.
- Controls include visible focus states and reduced-motion support.

## Review Findings

- P1: none found.
- P2: none found.
- P3: mobile navigation labels were initially too small; increased for readability.
- Full-page mobile capture can repeat the fixed navigation during screenshot stitching. DOM inspection confirmed one navigation and one feedback panel.

## Verification

- Desktop viewport: 1440 by 900, all six views rendered without horizontal overflow.
- Mobile viewport: 390 by 844, all six views rendered with mobile navigation and no broken images.
- Speaking interaction: start, finish, post-turn feedback, and retry states verified.
- Generated interview asset loaded successfully at its natural resolution.
- Browser console: no warnings or errors during the six-view smoke test.
- Automated UI tests cover navigation, listening order, speaking feedback cap, writing fact safety, and review queue advancement.

## Mock Boundaries

Microphone capture, audio playback timing, persistence, authentication, notifications, automated scoring, and Gemini calls remain mocked. The UI exposes the intended states without claiming these integrations are complete.
