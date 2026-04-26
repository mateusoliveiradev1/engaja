import type { ReactNode } from "react";

import { Stack } from "expo-router";

import { ProtectedRoute } from "../../src/app/route-guards.js";

export default function CollaboratorLayout(): ReactNode {
  return (
    <ProtectedRoute group="collaborator">
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedRoute>
  );
}
