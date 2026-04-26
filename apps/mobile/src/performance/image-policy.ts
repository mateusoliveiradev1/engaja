export const mobileImagePerformancePolicy = {
  cachePolicy: "memory-disk",
  feedCardHeightPx: 540,
  feedCardWidthPx: 720,
  format: "webp",
  placeholderMaxMs: 100,
  progressiveTransitionMs: 180,
  quality: 78,
} as const;

export function buildSizedImageUrl(
  photoUrl: string | undefined,
  width = mobileImagePerformancePolicy.feedCardWidthPx,
  height = mobileImagePerformancePolicy.feedCardHeightPx,
): string | undefined {
  if (photoUrl === undefined || photoUrl.trim().length === 0) {
    return undefined;
  }

  try {
    const url = new URL(photoUrl);

    url.searchParams.set("w", String(width));
    url.searchParams.set("h", String(height));
    url.searchParams.set("fit", "cover");
    url.searchParams.set("format", mobileImagePerformancePolicy.format);
    url.searchParams.set("q", String(mobileImagePerformancePolicy.quality));

    return url.toString();
  } catch {
    return photoUrl;
  }
}
