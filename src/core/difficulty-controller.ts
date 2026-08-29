export const pilotDifficultyPolicy = Object.freeze({
  lowerFirstPassAccuracy: 0.6,
  upperFirstPassAccuracy: 0.9,
  successesBeforeFade: 2,
});

export type DifficultyDecision =
  | "add_support"
  | "maintain"
  | "fade_support"
  | "increase_challenge";

export interface DifficultyObservation {
  firstPassAccuracy: number;
  scaffoldLevel: number;
  consecutiveSuccesses: number;
}
export function decideDifficulty(observation: DifficultyObservation): DifficultyDecision {
  if (observation.firstPassAccuracy < pilotDifficultyPolicy.lowerFirstPassAccuracy) {
    return "add_support";
  }

  const readyToAdvance =
    observation.firstPassAccuracy > pilotDifficultyPolicy.upperFirstPassAccuracy &&
    observation.consecutiveSuccesses >= pilotDifficultyPolicy.successesBeforeFade;

  if (!readyToAdvance) {
    return "maintain";
  }

  return observation.scaffoldLevel > 0 ? "fade_support" : "increase_challenge";
}
