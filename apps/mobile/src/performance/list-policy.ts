import type { FlatListProps } from "react-native";

type ListPerformanceProps = Pick<
  FlatListProps<unknown>,
  | "initialNumToRender"
  | "maxToRenderPerBatch"
  | "removeClippedSubviews"
  | "updateCellsBatchingPeriod"
  | "windowSize"
>;

export const feedListPerformanceProps = {
  initialNumToRender: 4,
  maxToRenderPerBatch: 4,
  removeClippedSubviews: true,
  updateCellsBatchingPeriod: 48,
  windowSize: 7,
} as const satisfies ListPerformanceProps;

export const mobileListPerformanceContracts = [
  {
    id: "feed.posts",
    memoizedItem: "FeedPostCard",
    strategy: "virtualized",
    surface: "collaborator-feed",
  },
  {
    id: "schedules.shifts",
    memoizedItem: "ShiftCard",
    strategy: "bounded-window",
    surface: "collaborator-and-leader-schedules",
  },
  {
    id: "operations.routines",
    memoizedItem: "ChecklistCard",
    strategy: "bounded-window",
    surface: "collaborator-routines",
  },
  {
    id: "dashboard.metrics",
    memoizedItem: "MetricTile",
    strategy: "bounded-window",
    surface: "leader-dashboard",
  },
] as const;
