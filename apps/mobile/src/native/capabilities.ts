export interface DevelopmentBuildCapability {
  readonly configPlugin: string;
  readonly developmentBuildRequired: boolean;
  readonly name: "camera" | "media-picker" | "secure-storage" | "push-notifications";
  readonly packageName: string;
}

export const developmentBuildCapabilities = [
  {
    configPlugin: "expo-camera",
    developmentBuildRequired: true,
    name: "camera",
    packageName: "expo-camera",
  },
  {
    configPlugin: "expo-image-picker",
    developmentBuildRequired: true,
    name: "media-picker",
    packageName: "expo-image-picker",
  },
  {
    configPlugin: "expo-secure-store",
    developmentBuildRequired: true,
    name: "secure-storage",
    packageName: "expo-secure-store",
  },
  {
    configPlugin: "expo-notifications",
    developmentBuildRequired: true,
    name: "push-notifications",
    packageName: "expo-notifications",
  },
] as const satisfies readonly DevelopmentBuildCapability[];
