import { computeStatus, RELEASE_STEPS, TOTAL_STEPS } from "../src/constants";

describe("computeStatus", () => {
  it("returns planned when no steps are completed", () => {
    expect(computeStatus([])).toBe("planned");
  });

  it("returns ongoing when at least one step is completed", () => {
    expect(computeStatus([0])).toBe("ongoing");
    expect(computeStatus([1, 3])).toBe("ongoing");
  });

  it("returns done when all steps are completed", () => {
    const allSteps = RELEASE_STEPS.map((s) => s.id);
    expect(computeStatus(allSteps)).toBe("done");
  });

  it("returns ongoing when all but one step is completed", () => {
    const allButLast = RELEASE_STEPS.slice(0, -1).map((s) => s.id);
    expect(computeStatus(allButLast)).toBe("ongoing");
  });
});

describe("RELEASE_STEPS", () => {
  it("has between 7 and 10 steps as per the spec", () => {
    expect(TOTAL_STEPS).toBeGreaterThanOrEqual(7);
    expect(TOTAL_STEPS).toBeLessThanOrEqual(10);
  });

  it("has unique step IDs", () => {
    const ids = RELEASE_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("step IDs are sequential starting from 0", () => {
    RELEASE_STEPS.forEach((step, index) => {
      expect(step.id).toBe(index);
    });
  });

  it("every step has a non-empty label", () => {
    RELEASE_STEPS.forEach((step) => {
      expect(step.label.length).toBeGreaterThan(0);
    });
  });
});
