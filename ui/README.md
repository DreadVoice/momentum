# Momentum UI

Web client for the Momentum API, built with React 19, TypeScript and Vite.

## Commands

```
npm install     Install dependencies
npm run dev     Start the dev server on http://localhost:5173
npm run build   Type-check and build to dist/
npm run preview Serve the production build
npm run lint    Run Oxlint
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Origin of the Spring Boot API |

Copy `.env.example` to `.env.local` to override it.

The client calls the API **cross-origin** rather than through a dev-server
proxy, so the CORS contract is exercised in development exactly as in
production. The dev server origin must appear in the API's
`CORS_ALLOWED_ORIGINS` (it is there by default).

## Features

- **Board** — Pending / In Progress / Completed columns, sorting and filtering
  by category, board and priority, account-wide counters including overdue.
- **Task detail** — a split panel with full metadata and subtask management
  (add, rename, toggle, delete).
- **Task editing** — create, edit, move between boards and delete.
- **Categories** — create, rename and delete.
- **Account** — profile, password change and account deletion.

## Design system

A single theme, *warm paper*, declared as tokens on `[data-theme='light']`.
No dark or black mode is implemented.

- **Typography** — Instrument Serif for display and italic accents, Schibsted
  Grotesk for UI and body, JetBrains Mono for labels, timestamps and meta.
- **Accent** — one warm vermilion, `oklch(58% 0.17 38)`.
- **Chrome** — a faux window bar (three dots plus the app name) frames the app;
  1px hairline borders, 14px radius, one soft diffused shadow, no gradients.
- **Layout** — grid-based split panels with hairline dividers.
- `.m-primary` is the primary button; `.m-oauth` is the neutral secondary
  treatment, keeping the design system's class name even though this API has no
  OAuth provider.

## Notes

- Tokens live in `localStorage`. The API sets `allowCredentials=false`, so a
  cookie session is not available to a cross-origin client.
- A 401 triggers one silent refresh, shared by all in-flight requests so a burst
  of failures cannot burn several rotating refresh tokens. The password-change
  and account-deletion endpoints opt out: they answer a wrong password with 401,
  which is a domain error rather than a dead session.
- Editing a task uses `PUT`, not `PATCH`: the API ignores null fields on a
  patch, so only a full replacement can clear a due date or a category.
- A category can only be deleted once no task references it. `tasks.category_id`
  is a RESTRICT foreign key with no JPA cascade, so the API would otherwise fail
  with an unhandled database error.
- Sort properties are constrained to the list the API whitelists
  (`createdAt`, `dueDate`, `priority`, `status`, `title`).

## Not implemented

Drag-and-drop between boards, and reassigning a task's category from the
category screen.
