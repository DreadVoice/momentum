# Momentum

A task manager built as a full-stack project: a Spring Boot REST API paired with a React web client.

**The backend is complete and tested, and the web client covers the full API surface.** `ui/` holds a React + TypeScript client: the three task boards, a task detail panel with subtasks, categories and account settings.

Momentum lets you keep tasks, sort them into categories, break them into subtasks, and see what is overdue. Accounts are isolated: no request can reach another account's data.

## Status

| Part | State |
|---|---|
| REST API | Done: auth, accounts, tasks, subtasks, categories |
| Authentication | Done: stateless JWT with access and refresh tokens |
| Database + migrations | Done: PostgreSQL with Flyway |
| API documentation | Done: OpenAPI 3 via springdoc |
| Tests | Unit, slice, and container-backed integration |
| Web client | Done: board, subtasks, categories, account |
| Deployment | Not set up |

## Repository layout

```
momentum
├── app                  Spring Boot backend (Java 21, Maven)
├── ui                   React web client (Vite, TypeScript)
├── docker-compose.yml   PostgreSQL for local development
└── .env.example         Template for the environment variables the app needs
```

## Running it

You need **JDK 21 or newer**, **Node 20 or newer**, and **Docker**.

**1. Configure the environment.** Copy the template and fill it in:

```bash
cp .env.example .env
```

`.env` is gitignored. `JWT_SECRET` must be at least 32 characters or the app refuses to start. `DB_PASSWORD` becomes the PostgreSQL container's password on first run.

**2. Start the database.**

```bash
docker compose up -d
```

PostgreSQL comes up on port **5433** (5432 is commonly taken by a local install; change `DB_PORT` if 5433 is busy too).

**3. Start the API,** in its own terminal:

```bash
cd app && ./mvnw spring-boot:run
```

On Windows PowerShell the wrapper is `.\mvnw.cmd` rather than `./mvnw`.

Flyway builds the schema on first boot. Wait for `Started AppApplication` — the API is then on `http://localhost:8080`.

**4. Start the client,** in a second terminal, from the repository root:

```bash
npm install --prefix ui && npm run dev --prefix ui
```

Open `http://localhost:5173` and register an account from the sign-in card. There is no seeded user, and passwords must be at least 8 characters.

The client reads its API origin from `VITE_API_BASE_URL`, which defaults to `http://localhost:8080`; copy `ui/.env.example` to `ui/.env.local` to change it.

> Register and login are rate limited to **5 requests per minute per IP**. If repeated auth testing starts returning *Too many attempts*, that is the backend refusing you: wait a minute, or raise `RATELIMIT_CAPACITY` in `.env` and restart the API.

## API reference

The API documents itself. With the app running:

| | |
|---|---|
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI spec | http://localhost:8080/v3/api-docs |

Both are public. Every other endpoint outside `/api/auth/**` and `GET /api/health` needs a bearer token, which you can paste into Swagger UI's **Authorize** box to try the endpoints directly.

To get one:

```bash
curl -X POST localhost:8080/api/auth/register -H 'Content-Type: application/json' -d '{"username":"you","email":"you@example.com","password":"password123"}'
```

## How a request flows

```
HTTP request
   -> JwtAuthenticationFilter   reads the Bearer token, works out who is calling
   -> Controller                validates the request body, no business logic
   -> Service                   the rules live here, including "do you own this?"
   -> Repository                Spring Data JPA
   -> PostgreSQL
```

Anything thrown along the way is caught by `GlobalExceptionHandler` and turned into a consistent JSON error, so controllers contain no `try`/`catch`.

## Authentication and ownership

You register or log in, get two tokens back, and send the access token on every subsequent request as `Authorization: Bearer <accessToken>`. Access tokens are stateless; refresh tokens are persisted as SHA-256 hashes so they can be revoked.

| Token | Lifetime | Purpose |
|---|---|---|
| Access | 15 minutes | Sent with every request |
| Refresh | 7 days | Exchanged at `/api/auth/refresh` for a fresh pair, and rotated on every use |

Both are signed with HS256 and carry the user's id as the subject, a unique `jti`, and a `type` claim so a refresh token cannot be used in place of an access token. Passwords are stored as BCrypt hashes and are never returned by any endpoint.

Refreshing rotates the token: the row backing the old one is deleted and a new pair is issued. Three things end a session early:

- `POST /api/auth/logout` with the refresh token, which deletes its row and returns 204. It is idempotent, so an unknown token still returns 204 rather than revealing whether it was valid.
- Changing the password, which revokes every refresh token for that account.
- Presenting a refresh token that has already been rotated. That is the signature of a stolen token, so every token for the account is revoked rather than just the one presented.

An access token already issued stays valid until it expires, so revocation is not instant: worst case a session survives 15 more minutes.

The browser client keeps both tokens in `localStorage`. That is readable by any script running on the page, which is the trade made for a stateless API with no cookie handling; it is why the API sets `allowCredentials=false` and the client sends `credentials: omit`.

`POST /api/auth/login` and `POST /api/auth/register` are rate limited per client address, 5 requests a minute by default. The buckets are held in memory, so limits reset on restart and are not shared between instances. The client address is read from `X-Forwarded-For`, which is correct behind a proxy that overwrites it and wrong if the app is exposed directly; set `RATELIMIT_TRUST_FORWARDED=false` in that case.

**No endpoint accepts a user id.** The caller's identity comes only from the verified token, so there is no field a client could change to reach someone else's data. Services take the caller's id as their first argument and check ownership themselves.

When you ask for something that exists but is not yours, the API returns **404, not 403**. A 403 would confirm the record exists. Missing and not-yours look identical from the outside.

## Errors

Every error, including ones raised inside the security filters, comes back in the same shape:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "timestamp": "2026-08-02T09:15:22.481",
  "fieldErrors": { "email": "Email should be valid" }
}
```

`fieldErrors` appears only for validation failures.

## Database

PostgreSQL, with the schema managed by Flyway migrations in `app/src/main/resources/db/migration`. Hibernate runs in `validate` mode, so it compares the entities against the migrated schema at startup and refuses to boot if they disagree. Schema changes are always a reviewable file, never a side effect of starting the app.

To change the schema, add `V{n}__description.sql`. Never edit a migration that has already run.

## Tests

```bash
cd app
./mvnw test
```

Four layers, each proving something the others cannot:

| Layer | What it proves |
|---|---|
| Service (Mockito) | Business rules and ownership checks |
| Controller (`@WebMvcTest`) | Status codes, validation, the real security filter chain |
| Repository (`@DataJpaTest`) | The generated SQL, against real PostgreSQL |
| Integration (`@SpringBootTest`) | Full journeys over HTTP with real tokens |

The repository and integration layers run against PostgreSQL in Testcontainers, so **Docker must be running** for the whole suite to execute. Without Docker they skip rather than fail, which means a green build on a machine with no Docker has not tested those layers.

The integration suite includes an adversarial one: two users register, and one tries to read, edit, and delete the other's data through every endpoint that accepts an id.

## The frontend

`ui/` is a React 19 + Vite + TypeScript client covering the whole API: the three task boards with sorting and filtering, a task detail panel with subtask management, category CRUD, and account settings. It ships a single light theme, *warm paper*.

The client calls the API cross-origin rather than through a dev-server proxy, so the CORS contract is exercised in development exactly as in production. The API allows browser requests from the origins in `CORS_ALLOWED_ORIGINS`, which defaults to the Vite dev server at `http://localhost:5173`; a deployed client needs its own origin added there.

Two API details shape the client, and are worth knowing before changing it:

- `PATCH /api/tasks/{id}` ignores null fields, so editing a task uses `PUT`. Only a full replacement can clear a due date or detach a category.
- `tasks.category_id` is a RESTRICT foreign key with no cascade, so a category that still holds tasks cannot be deleted. The UI disables that action rather than letting the request fail as an unhandled database error.

See [ui/README.md](ui/README.md) for commands and design notes.

## Roadmap

- Dockerfile and a deployment target
- Drag-and-drop between the boards
- Reassigning a task's category from the category screen

## License

[MIT](LICENSE) © DreadVoice
