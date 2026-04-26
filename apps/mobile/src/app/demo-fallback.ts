interface MobileDemoFallbackGlobal {
  readonly __ENGAJA_ENABLE_MOBILE_DEMO_FALLBACK__?: unknown;
}

export function isMobileDemoFallbackEnabled(): boolean {
  if ((globalThis as MobileDemoFallbackGlobal).__ENGAJA_ENABLE_MOBILE_DEMO_FALLBACK__ === true) {
    return true;
  }

  return process.env.EXPO_PUBLIC_ENABLE_DEMO_FALLBACK === "true";
}
