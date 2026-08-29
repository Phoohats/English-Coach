import { describe, expect, it } from "vitest";
import {
  executeWithFallback,
  MockAiProvider,
  type AiRequest,
  type AiResponse,
} from "../src/ai/provider.js";

const request: AiRequest = {
  task: "roleplay",
  input: "Hello, I'm Niran.",
};

function fixedResponse(output: string): AiResponse {
  return {
    output,
    provider: "mock",
    model: "fixed-roleplay",
    requestId: "mock-request-001",
  };
}

describe("AI provider boundary", () => {
  it("returns the provider response when the provider succeeds", async () => {
    const provider = new MockAiProvider(() => fixedResponse("Nice to meet you."));

    const result = await executeWithFallback(provider, request, () =>
      fixedResponse("Fallback response"),
    );

    expect(result.usedFallback).toBe(false);
    expect(result.response.output).toBe("Nice to meet you.");
  });

  it("uses a deterministic fallback when the provider fails", async () => {
    const provider = new MockAiProvider(() => {
      throw new Error("provider unavailable");
    });

    const result = await executeWithFallback(provider, request, () =>
      fixedResponse("What is your name?"),
    );

    expect(result).toMatchObject({
      usedFallback: true,
      failureCode: "provider_error",
      response: { output: "What is your name?" },
    });
  });
});
