import { describe, expect, it } from "vitest";
import {
  featureFlagDefaults,
  isFeatureEnabled,
  resolveFeatureFlags,
} from "../src/core/feature-flags.js";

describe("feature flags", () => {
  it("keeps every risky feature disabled by default", () => {
    expect(Object.values(featureFlagDefaults).every((enabled) => !enabled)).toBe(true);
  });

  it("enables only an explicitly overridden known feature", () => {
    const flags = resolveFeatureFlags({ aiRoleplay: true });

    expect(isFeatureEnabled("aiRoleplay", flags)).toBe(true);
    expect(isFeatureEnabled("cvIngestion", flags)).toBe(false);
  });

  it("fails closed for an unknown feature name", () => {
    expect(isFeatureEnabled("futureFeature")).toBe(false);
  });
});
