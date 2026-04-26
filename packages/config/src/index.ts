export const workspacePackageNames = [
  "@engaja/api",
  "@engaja/mobile",
  "@engaja/ui",
  "@engaja/domain",
  "@engaja/application",
  "@engaja/data",
  "@engaja/contracts",
  "@engaja/security",
  "@engaja/config",
] as const;

export type WorkspacePackageName = (typeof workspacePackageNames)[number];

export {
  performanceBudgetChecklist,
  performanceBudgets,
  type PerformanceBudgetCategory,
} from "./performance.js";
