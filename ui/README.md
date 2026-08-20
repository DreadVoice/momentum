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

## Layout

```
src
├── api          Transport (httpClient) and one module per resource
├── types/api.ts TypeScript mirror of the backend DTOs
├── lib          ApiError, token storage, date helpers
├── context      AuthProvider and the session context
├── hooks        useAuth, useDismissable
├── components   Shared primitives and the nav bar
└── features
    ├── auth     Sign-in / sign-up card
    └── board    Three-status board, task card, create/edit dialog
```

## Notes

- Tokens live in `localStorage`. The API sets `allowCredentials=false`, so a
  cookie session is not available to a cross-origin client.
- A 401 triggers one silent refresh, shared by all in-flight requests so a
  burst of failures cannot burn several rotating refresh tokens.
- Editing a task uses `PUT`, not `PATCH`: the API ignores null fields on a
  patch, so only a full replacement can clear a due date or a category.
- Sort properties are constrained to the list the API whitelists
  (`createdAt`, `dueDate`, `priority`, `status`, `title`).

## Not yet built

Subtask management, category CRUD, account settings and drag-and-drop between
boards.
