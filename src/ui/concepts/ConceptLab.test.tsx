// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConceptLab } from "./ConceptLab.js";

beforeEach(() => {
  window.history.replaceState({}, "", "/?mockups=1");
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe("six-concept design lab", () => {
  it("offers six distinct design directions", () => {
    render(<ConceptLab />);

    for (const name of [
      "Focus Garden",
      "Career Desk",
      "Bright Steps",
      "Quiet Editorial",
      "Coach Conversation",
      "Skill Compass",
    ]) {
      expect(screen.getByRole("button", { name: new RegExp(name) })).toBeTruthy();
    }
  });

  it("switches the full mockup and preserves the selected concept in the URL", () => {
    render(<ConceptLab />);

    const careerDesk = screen.getByRole("button", { name: /Career Desk/ });
    fireEvent.click(careerDesk);
    expect(careerDesk.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("heading", { name: "Interview readiness" })).toBeTruthy();
    expect(window.location.search).toBe("?mockups=1&concept=2");

    const skillCompass = screen.getByRole("button", { name: /Skill Compass/ });
    fireEvent.click(skillCompass);
    expect(skillCompass.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("heading", { name: "Your learning compass" })).toBeTruthy();
    expect(window.location.search).toBe("?mockups=1&concept=6");
  });
});
