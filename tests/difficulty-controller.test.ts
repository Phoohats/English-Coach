import { describe, expect, it } from "vitest";
import { decideDifficulty } from "../src/core/difficulty-controller.js";

describe("difficulty controller", () => {
  it("adds support when first-pass comprehension is below the pilot window", () => {
    expect(
      decideDifficulty({ firstPassAccuracy: 0.5, scaffoldLevel: 1, consecutiveSuccesses: 0 }),
    ).toBe("add_support");
  });

  it("maintains difficulty inside the pilot window", () => {
    expect(
      decideDifficulty({ firstPassAccuracy: 0.8, scaffoldLevel: 1, consecutiveSuccesses: 2 }),
    ).toBe("maintain");
  });

  it("does not advance after only one high-scoring attempt", () => {
    expect(
      decideDifficulty({ firstPassAccuracy: 0.95, scaffoldLevel: 1, consecutiveSuccesses: 1 }),
    ).toBe("maintain");
  });

  it("fades support after repeated high-scoring attempts", () => {
    expect(
      decideDifficulty({ firstPassAccuracy: 0.95, scaffoldLevel: 1, consecutiveSuccesses: 2 }),
    ).toBe("fade_support");
  });

  it("increases challenge when no support remains", () => {
    expect(
      decideDifficulty({ firstPassAccuracy: 0.95, scaffoldLevel: 0, consecutiveSuccesses: 2 }),
    ).toBe("increase_challenge");
  });
});
