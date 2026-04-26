## Environment and Current-State Audit

### 1.1 Mobile and API auth state

- `apps/mobile/src/app/providers.tsx` still initializes with a development collaborator session by default, so unauthenticated launch does not yet depend on a server-backed session.
- `apps/mobile/src/app/route-guards.tsx` protects route groups with role-based redirects, but it only reads the local session context.
- `apps/mobile/app/(auth)/sign-in.tsx` delegates to `SignInScreen`; current auth UI is a polished placeholder surface and does not submit real credentials yet.
- `apps/api/src/index.ts` exposes `/auth/session`, but missing bearer tokens still return a development collaborator session. Protected product routes do verify bearer tokens through the configured auth adapter.
- `createApiAppFromEnvironment` already routes auth/storage provider setup through environment validation, while the default test/runtime app still uses in-memory repositories and the development auth adapter.
- Provider defaults remain local-first: `local-postgres`, `local-better-auth`, `local-filesystem`, `console`, `local-log`, `expo-local`, and `local`.

### 1.2 UI and visible copy state

- `packages/ui/src/foundations.ts` defines FLV-specific tokens, typography, state colors, motion and visual direction.
- `packages/ui/src/native/primitives.tsx` and `packages/ui/src/native/states.tsx` provide shared buttons, inputs, tabs, cards, badges, loading, empty, error, offline, permission and success states.
- `apps/mobile/src/app/screens.tsx` is still a large screen-composition module with many app flows in one file; later UI tasks can split it without moving business behavior into components.
- Visible product copy is mostly Brazilian Portuguese, but there are still user-facing placeholder/internal terms such as "modo local", "demo", "escopo", "fila local", sample local image URLs and development user ids.
- Current state surfaces are reusable and visually consistent, but auth, invite management and final copy centralization remain for later tasks in this change.

### 1.3-1.5 Environment outcome

- `.gitignore` ignores `.env` and `.env.*`, while allowing committed `.env.example` files.
- A local root `.env` was created from the previously supplied root example values without printing secrets.
- Root, API and mobile `.env.example` files now contain placeholders or safe local samples only.
- Server-only validation now covers database, auth, invite and session secret names, including real-provider required values.
- Mobile public environment validation now allows only the approved Expo public variables and rejects database/auth/invite/session secret exposure.
