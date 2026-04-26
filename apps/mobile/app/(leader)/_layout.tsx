import type { ReactNode } from "react";

import { Stack } from "expo-router";

import { ProtectedRoute } from "../../src/app/route-guards.js";

export default function LeaderLayout(): ReactNode {
  return (
    <ProtectedRoute group="leader">
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedRoute>
  );
}
