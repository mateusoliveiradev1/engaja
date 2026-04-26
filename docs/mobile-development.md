# Mobile Development

The default mobile workflow is fully local and does not require EAS remote builds.

## Default Commands

From the repo root:

```bash
pnpm --filter @engaja/mobile dev
pnpm --filter @engaja/mobile android
```

Useful local-only commands:

```bash
pnpm --filter @engaja/mobile native:prebuild
pnpm --filter @engaja/mobile test
pnpm --filter @engaja/mobile bundle:analyze
```

## Default Provider Path

- `BUILD_PROVIDER=expo-local`
- `ALLOW_METERED_PROVIDERS=false`
- Android/dev builds happen through `expo run:android`
- Development sessions and analytics stay on local-safe adapters

This keeps day-to-day engineering on emulators, devices and local development builds.

## Optional EAS Usage

EAS remote builds are not required for the MVP branch. Use them only when you
explicitly want the hosted path and are comfortable consuming free quota or paid usage.

When that moment comes:

1. Keep the normal local flow as the baseline.
2. Flip `ALLOW_METERED_PROVIDERS=true` only for the session that needs it.
3. Set `BUILD_PROVIDER=eas-remote`.
4. Treat remote builds as a release/distribution convenience, not a prerequisite for
   feature development.

## Cost Boundary

Local development remains no-spend. Production publishing does not.

- Google Play and Apple developer accounts may require payment.
- Production crash reporting, OTA rollout, observability and distribution tooling can
  require paid plans.
- Remote build minutes and store submission tooling should be treated as production or
  release budget items, not local development assumptions.
