# Momentum UI

Web client for the Momentum API, built with React 19, TypeScript and Vite,
styled with Tailwind CSS v4 and shadcn/ui components over Radix primitives.

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

- **Board**: Pending / In Progress / Completed columns, sorting and filtering
  by category, board and priority, account-wide counters including overdue.
- **Drag-and-drop**: move a task between boards by dragging its handle, or from
  the keyboard — focus the handle, <kbd>Space</kbd> to lift, arrow keys to move
  one column per press, <kbd>Space</kbd> to drop, <kbd>Esc</kbd> to cancel. The
  card menu offers the same moves as ordinary menu items.
- **Task detail**: a split panel with full metadata and subtask management
  (add, rename, toggle, delete).
- **Task editing**: create, edit, move between boards and delete.
- **Categories**: create, rename and delete.
- **Account**: profile, password change and account deletion.
- **Themes**: light, dark, or follow the system, remembered across reloads.

## Design system

A cool neutral product palette built on Tailwind CSS v4, with light and dark
themes. Tokens are CSS custom properties in `src/index.css`: the light set on
`:root`, the dark set under `.dark`, both projected into Tailwind through
`@theme inline`.

- **Colour**: near-achromatic greys with a slight blue cast. Semantic hues are
  kept distinct so no two meanings share a colour — `brand` (indigo) for focus
  and selection, `destructive` (red) for deletion and overdue, `warning`
  (amber) for high priority, `success` (green) for completion. `primary` is
  near-black in light and near-white in dark, which keeps dense UI calm.
- **Typography**: Inter for everything, with `tabular-nums` (the `.tabular`
  utility) on counters, dates and timestamps so they do not jitter as they
  update.
- **Components**: shadcn/ui components live in `src/components/ui/` and are
  owned by this repository — edit them directly. They wrap Radix primitives,
  which supply focus management, keyboard navigation and ARIA for the dialog,
  alert dialog, dropdown menu, select, checkbox, tooltip and label.
- **Theming**: `ThemeProvider` owns the light/dark/system choice and persists
  it to `localStorage`. An inline script in `index.html` applies the stored
  choice before first paint, so a dark-mode reload never flashes white.
- **Motion**: Motion (`motion/react`) drives list and layout transitions;
  everything else is a CSS transition. A `prefers-reduced-motion` block in
  `src/index.css` reduces all of it to near-zero.
- **Responsive**: single column on phones, two from `md`, three from `xl`; the
  detail panel drops below the board rather than beside it under `xl`.

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

Reassigning a task's category from the category screen.
