"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOTAL_STEPS = exports.RELEASE_STEPS = void 0;
exports.computeStatus = computeStatus;
exports.RELEASE_STEPS = [
    { id: 0, label: "All relevant GitHub pull requests have been merged" },
    { id: 1, label: "CHANGELOG.md files have been updated" },
    { id: 2, label: "All tests are passing" },
    { id: 3, label: "Release created in GitHub" },
    { id: 4, label: "Deployed in demo environment" },
    { id: 5, label: "Tested thoroughly in demo" },
    { id: 6, label: "Deployed in production" },
    { id: 7, label: "Post-deployment smoke tests passed" },
    { id: 8, label: "Stakeholders notified of release" },
];
exports.TOTAL_STEPS = exports.RELEASE_STEPS.length;
function computeStatus(completedSteps) {
    if (completedSteps.length === 0)
        return "planned";
    if (completedSteps.length >= exports.TOTAL_STEPS)
        return "done";
    return "ongoing";
}
