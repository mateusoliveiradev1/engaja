import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "../src/app/providers.js";

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="dark" />
    </AppProviders>
  );
}
