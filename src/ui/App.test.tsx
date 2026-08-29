// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.js";

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe("learning UI prototype", () => {
  it("renders all six learning destinations", () => {
    render(<App />);

    expect(document.querySelector("[data-design='quiet-editorial']")).toBeTruthy();
    for (const label of ["Today", "Learn", "Speak", "Write", "Review", "Progress"]) {
      expect(screen.getAllByRole("button", { name: label }).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("heading", { name: "Tell me about yourself" })).toBeTruthy();
  });

  it("supports the listening activity flow", () => {
    window.history.replaceState({}, "", "/?view=lesson");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Transcript" }));
    expect(screen.getByText("I currently work as a site engineer.", { exact: false })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Present role" }));
    fireEvent.click(screen.getByRole("button", { name: "Specific evidence" }));
    fireEvent.click(screen.getByRole("button", { name: "Target role" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

    expect(screen.getByText("You found the structure")).toBeTruthy();
  });

  it("waits until a speaking turn ends before showing two feedback points", () => {
    window.history.replaceState({}, "", "/?view=speak");
    render(<App />);

    expect(screen.queryByText("Your answer was clear and relevant")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Start answer" }));
    fireEvent.click(screen.getByRole("button", { name: "Finish answer" }));

    expect(screen.getByText("Your answer was clear and relevant")).toBeTruthy();
    expect(screen.getByText("Name one specific result after your current role.")).toBeTruthy();
    expect(screen.getByText("Try: One result I’m proud of is…")).toBeTruthy();
    expect(screen.queryByText("Use “a site engineer” for the job title.")).toBeNull();
  });

  it("shows writing feedback without inventing learner facts", () => {
    window.history.replaceState({}, "", "/?view=write");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Check my draft" }));
    expect(screen.getByText("Add evidence")).toBeTruthy();
    expect(screen.getByText("[your real result]", { exact: false })).toBeTruthy();
  });

  it("advances the adaptive review queue after grading recall", () => {
    window.history.replaceState({}, "", "/?view=review");
    render(<App />);

    expect(screen.getByText("Introduce your current role")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Good/ }));
    expect(screen.getByText("Spot the measurable result")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });
});
