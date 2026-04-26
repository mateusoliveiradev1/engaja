import {
  operationsViewPayloadSchema,
  type OperationsViewPayload,
} from "@engaja/contracts";

import type { OperationsViewResult } from "./operations.js";

export function toOperationsViewPayload(view: OperationsViewResult): OperationsViewPayload {
  return operationsViewPayloadSchema.parse({
    highlight: view.highlight,
    issues: view.issues.map((issue) => ({
      category: issue.category,
      createdAt: issue.createdAt.toISOString(),
      evidencePhotoUrls: issue.evidencePhotoUrls,
      id: issue.id,
      ...(issue.note === undefined ? {} : { note: issue.note }),
      pendingSync: issue.pendingSync,
      ...(issue.productName === undefined ? {} : { productName: issue.productName }),
      ...(issue.quantity === undefined ? {} : { quantity: issue.quantity }),
      ...(issue.reportedByUserId === undefined
        ? {}
        : { reportedByUserId: issue.reportedByUserId }),
      ...(issue.reportedByUserName === undefined
        ? {}
        : { reportedByUserName: issue.reportedByUserName }),
      severity: issue.severity,
      ...(issue.shiftId === undefined ? {} : { shiftId: issue.shiftId }),
      status: issue.status,
    })),
    learningBites: view.learningBites.map((bite) => ({
      completed: bite.completed,
      ...(bite.completedAt === undefined ? {} : { completedAt: bite.completedAt.toISOString() }),
      ...(bite.completedByUserId === undefined
        ? {}
        : { completedByUserId: bite.completedByUserId }),
      ...(bite.completedByUserName === undefined
        ? {}
        : { completedByUserName: bite.completedByUserName }),
      description: bite.description,
      durationMinutes: bite.durationMinutes,
      ...(bite.feedPostId === undefined ? {} : { feedPostId: bite.feedPostId }),
      id: bite.id,
      ...(bite.missionTitle === undefined ? {} : { missionTitle: bite.missionTitle }),
      pendingSync: bite.pendingSync,
      ...(bite.pointsAwarded === undefined ? {} : { pointsAwarded: bite.pointsAwarded }),
      ...(bite.standardId === undefined ? {} : { standardId: bite.standardId }),
      title: bite.title,
    })),
    routines: view.routines.map((routine) => ({
      checklistTitle: routine.checklistTitle,
      description: routine.description,
      evidence: routine.evidence,
      focusChips: routine.focusChips,
      id: routine.id,
      items: routine.items.map((item) => ({
        ...(item.completedAt === undefined ? {} : { completedAt: item.completedAt.toISOString() }),
        ...(item.completedByUserId === undefined
          ? {}
          : { completedByUserId: item.completedByUserId }),
        ...(item.completedByUserName === undefined
          ? {}
          : { completedByUserName: item.completedByUserName }),
        evidenceMode: item.evidenceMode,
        ...(item.evidencePhotoUrl === undefined
          ? {}
          : { evidencePhotoUrl: item.evidencePhotoUrl }),
        ...(item.helper === undefined ? {} : { helper: item.helper }),
        id: item.id,
        label: item.label,
        ...(item.note === undefined ? {} : { note: item.note }),
        pendingSync: item.pendingSync,
        ...(item.shiftId === undefined ? {} : { shiftId: item.shiftId }),
        status: item.status,
      })),
      label: routine.label,
      note: routine.note,
      standardIds: routine.standardIds,
    })),
    shiftSummary: {
      completedRoutineCount: view.shiftSummary.completedRoutineCount,
      evidenceCount: view.shiftSummary.evidenceCount,
      evidenceItems: view.shiftSummary.evidenceItems.map((item) => ({
        id: item.id,
        label: item.label,
        ...(item.photoUrl === undefined ? {} : { photoUrl: item.photoUrl }),
        status: item.status,
      })),
      openIssueCount: view.shiftSummary.openIssueCount,
      openIssues: view.shiftSummary.openIssues.map((issue) => ({
        id: issue.id,
        label: issue.label,
        severity: issue.severity,
        status: issue.status,
      })),
      overdueItemCount: view.shiftSummary.overdueItemCount,
      overdueItems: view.shiftSummary.overdueItems,
      pendingSyncCount: view.shiftSummary.pendingSyncCount,
      ...(view.shiftSummary.shiftId === undefined ? {} : { shiftId: view.shiftSummary.shiftId }),
      title: view.shiftSummary.title,
      wins: view.shiftSummary.wins,
    },
    standards: view.standards.map((standard) => ({
      category: standard.category,
      checkpoints: standard.checkpoints,
      id: standard.id,
      instructions: standard.instructions,
      referenceLabel: standard.referenceLabel,
      relatedActionLabels: standard.relatedActionLabels,
      title: standard.title,
    })),
    summary: view.summary,
  });
}
