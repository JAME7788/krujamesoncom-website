# Game-Based Learning: 36 games

## Teaching loop

1. Before play: accept a game-specific, observable learning mission. The game mounts only after acceptance so timers do not run behind the briefing.
2. During play: use the existing mechanics to test a strategy. A mission hint is available without a score penalty.
3. After play: answer a transfer question with explanatory feedback, then describe the action, result, and next adjustment. Incorrect answers can be retried.
4. Replay: return to the game and use its replay controls to try the revised strategy.

`src/data/gameMissions.ts` defines objectives, actions, hints, questions, and explanations. `GameLearningJourney` wraps every catalog route. The shared `useGameProgress` event announces completion independently of authentication or score persistence. The existing game result screen remains available.

## Evidence and boundaries

- The briefing uses the actual screenshot for each of the 36 games. Learners choose a foundation mission or a game-specific extension from `gameChallenges.ts`; these are learning challenges, not engine difficulty settings.
- During play the mission collapses to an inline strip. Details and hints are opt-in, and the learning checklist reflects completion events, question correctness, and reflection separately. The encouragement badge is session feedback, not a persisted award.

- Game score, transfer-question correctness, and a learner's written reflection are different forms of evidence. This change does not equate them or change subject grades.
- Reflections remain in component state until leaving the route. They are not submitted to a teacher or saved across devices. The interface states this explicitly.
- Teachers can ask younger pupils to explain orally and help type the reflection.
- Movement games target planning, classification, or inhibition where those actions actually exist; catching an insect is not evidence of programming/debugging skill.
- This shared learning cycle does not replace every game's internal mechanics or automatically pause its timers. Complete or pause the round using the game's own controls before reflection.

## Verification

- `npx vitest run tests/gameMissions.test.ts`: catalog coverage and complete mission content.
- `npm run qa:games`: existing game content checks.
- `node scripts/qa-game-learning.mjs`: all 36 entry routes, screenshots, a complete 12-question binary round, wrong-answer/retry feedback, reflection, and mobile width.
- Browser script accepts `QA_BASE_URL` and `CHROME_PATH`; defaults target the local Windows development environment.
