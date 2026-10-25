export const RELEASE_STEPS = [
  { id: 0, label: "All relevant GitHub pull requests have been merged" },
  { id: 1, label: "CHANGELOG.md files have been updated" },
  { id: 2, label: "All tests are passing" },
  { id: 3, label: "Release created in GitHub" },
  { id: 4, label: "Deployed in demo environment" },
  { id: 5, label: "Tested thoroughly in demo" },
  { id: 6, label: "Deployed in production" },
  { id: 7, label: "Post-deployment smoke tests passed" },
  { id: 8, label: "Stakeholders notified of release" },
] as const;

export const TOTAL_STEPS = RELEASE_STEPS.length;

export type ReleaseStatus = "planned" | "ongoing" | "done";

export function computeStatus(completedSteps: number[]): ReleaseStatus {
  if (completedSteps.length === 0) return "planned";
  if (completedSteps.length >= TOTAL_STEPS) return "done";
  return "ongoing";
}
