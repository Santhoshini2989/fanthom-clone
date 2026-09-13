import { describe, expect, it } from "vitest";
import { TRANSITIONS, canTransition } from "@/server/meetings/state";

describe("meeting state machine", () => {
  it("follows the happy path in order", () => {
    const path = ["SCHEDULED", "BOT_REQUESTED", "BOT_JOINING", "RECORDING", "PROCESSING", "TRANSCRIBING", "ANALYZING", "COMPLETED"] as const;
    for (let i = 0; i < path.length - 1; i++) expect(canTransition(path[i], path[i + 1])).toBe(true);
  });

  it("allows any non-terminal state to fail", () => {
    for (const from of Object.keys(TRANSITIONS) as (keyof typeof TRANSITIONS)[]) {
      if (from === "COMPLETED" || from === "FAILED") continue;
      expect(canTransition(from, "FAILED")).toBe(true);
    }
  });

  it("supports retry from FAILED into bot or processing", () => {
    expect(canTransition("FAILED", "BOT_REQUESTED")).toBe(true);
    expect(canTransition("FAILED", "PROCESSING")).toBe(true);
  });

  it("rejects illegal jumps", () => {
    expect(canTransition("SCHEDULED", "COMPLETED")).toBe(false);
    expect(canTransition("RECORDING", "ANALYZING")).toBe(false);
    expect(canTransition("COMPLETED", "RECORDING")).toBe(false);
    expect(canTransition("TRANSCRIBING", "RECORDING")).toBe(false);
  });
});
