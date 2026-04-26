# Mobile Security Checklist

This checklist anchors the FLV app to OWASP MASVS-style expectations for the MVP.

## Storage

- Store access tokens only through the secure-storage adapter.
- Keep Neon URLs, database credentials, server secrets and provider private keys out of
  the mobile package and every `EXPO_PUBLIC_*` variable.
- Treat cached feed, schedule, routine and recognition data as scoped user data; clear it
  when the session changes.

## Network

- Send all product data through the API contracts; the mobile app must never connect to
  Neon or object storage with server credentials.
- Require bearer auth for protected API calls and include `x-request-id` for traceable
  support/debug sessions.
- Use private media access through signed or proxied API-approved URLs.

## Auth And Session

- Keep provider-specific auth behind the server adapter.
- Enforce route-group access before rendering collaborator, leader or audit-sensitive
  screens.
- Deny restricted routes with a safe fallback that does not expose leader data.

## Platform Interaction

- Request camera, media picker, secure storage and notification permissions only at the
  flow that needs them.
- Strip, ignore or prevent location metadata in user-submitted photos before publication.
- Keep development build capabilities explicit in `apps/mobile/src/native/capabilities.ts`.

## Privacy

- Display only role- and scope-allowed feed, schedule, routine, recognition and dashboard
  data.
- Avoid public negative performance rankings or sensitive member details.
- Log recoverable client errors with redacted metadata and never include secrets, tokens,
  raw authorization headers or database identifiers.

## Release Gate

- Run `pnpm security`, `pnpm typecheck`, `pnpm test` and mobile visual checks before a
  release candidate.
- Review narrow Android, iPhone and tablet-width screenshots for clipped text, overlap,
  missing permission states and generic fallback screens.
