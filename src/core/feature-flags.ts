export type FeatureFlagName =
  | "adaptivePlacement"
  | "aiRoleplay"
  | "cvIngestion"
  | "livePronunciationScoring";
export type FeatureFlagState = Readonly<Record<FeatureFlagName, boolean>>;

export const featureFlagDefaults: FeatureFlagState = Object.freeze({
  adaptivePlacement: false,
  aiRoleplay: false,
  cvIngestion: false,
  livePronunciationScoring: false,
});

export function resolveFeatureFlags(
  overrides: Partial<Record<FeatureFlagName, boolean>> = {},
): FeatureFlagState {
  const resolved = { ...featureFlagDefaults };

  for (const name of Object.keys(featureFlagDefaults) as FeatureFlagName[]) {
    if (typeof overrides[name] === "boolean") {
      resolved[name] = overrides[name];
    }
  }

  return Object.freeze(resolved);
}

export function isFeatureEnabled(
  name: string,
  flags: FeatureFlagState = featureFlagDefaults,
): boolean {
  if (!Object.hasOwn(featureFlagDefaults, name)) {
    return false;
  }

  return flags[name as FeatureFlagName] === true;
}
