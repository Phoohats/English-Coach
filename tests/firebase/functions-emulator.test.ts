import { describe, expect, it } from "vitest";

const HEALTH_URL =
  "http://127.0.0.1:5001/demo-english-career-coach/asia-southeast1/health";

function expectExactJson(
  actual: unknown,
  expected: Record<string, string>,
): void {
  expect(actual).toStrictEqual(expected);
  expect(Object.keys(actual as Record<string, unknown>)).toEqual(
    Object.keys(expected),
  );
}

describe("Functions emulator health", () => {
  it("returns the exact health payload for GET", async () => {
    const response = await fetch(HEALTH_URL);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expectExactJson(await response.json(), {
      status: "ok",
      service: "english-career-coach-functions",
      version: "v1",
      environment: "emulator",
    });
  });

  it("rejects non-GET methods with the exact error payload", async () => {
    const response = await fetch(HEALTH_URL, { method: "POST" });

    expect(response.status).toBe(405);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expectExactJson(await response.json(), {
      error: "method_not_allowed",
    });
  });
});
