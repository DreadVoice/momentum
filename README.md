# Momentum

A task manager built as a full-stack project: a Spring Boot REST API paired with an Electron + React desktop client.

**The backend is complete and tested. The desktop client has not been built yet.** `ui/` holds a scaffolded Vite + React + Electron shell that still shows the starter template. Everything in the API is exercised through tests and HTTP, not through a user interface.

Momentum lets you keep tasks, sort them into categories, break them into subtasks, and see what is overdue. Accounts are isolated: no request can reach another account's data.

## Status

| Part | State |
|---|---|
| REST API | Done: auth, accounts, tasks, subtasks, categories |
| Authentication | Done: stateless JWT with access and refresh tokens |
| Database + migrations | Done: MySQL with Flyway |
| API documentation | Done: OpenAPI 3 via springdoc |
| Tests | Unit, slice, and container-backed integration |
| Desktop client | **Not started**, scaffolding only |
| Deployment | Not set up |

## Repository layout

```
momentum
├── app                  Spring Boot backend (Java 21, Maven)
├── ui                   Electron + React client (scaffolding only)
├── docker-compose.yml   MySQL for local development
└── .env.example         Template for the environment variables the app needs
```

## Running the backend

You need **JDK 21** and **Docker**.

**1. Configure the environment.** Copy the template and fill it in:

```bash
cp .env.example .env
```

`.env` is gitignored. `JWT_SECRET` must be at least 32 characters or the app refuses to start. `DB_PASSWORD` becomes the MySQL container's root password on first run.

**2. Start the database.**

```bash
docker compose up -d
```

MySQL comes up on port **3308** (3306 and 3307 are commonly taken by other installs; change `DB_PORT` if 3308 is busy too).

**3. Run the app.**

```bash
cd app
./mvnw spring-boot:run
```

Flyway builds the schema on first boot. The API is then on `http://localhost:8080`.

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
   -> MySQL
```

Anything thrown along the way is caught by `GlobalExceptionHandler` and turned into a consistent JSON error, so controllers contain no `try`/`catch`.

## Authentication and ownership

Authentication is stateless. You register or log in, get two tokens back, and send the access token on every subsequent request as `Authorization: Bearer <accessToken>`.

| Token | Lifetime | Purpose |
|---|---|---|
| Access | 15 minutes | Sent with every request |
| Refresh | 7 days | Exchanged at `/api/auth/refresh` for a fresh pair |

Both are signed with HS256 and carry the user's id as the subject, plus a `type` claim so a refresh token cannot be used in place of an access token. Passwords are stored as BCrypt hashes and are never returned by any endpoint.

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

MySQL, with the schema managed by Flyway migrations in `app/src/main/resources/db/migration`. Hibernate runs in `validate` mode, so it compares the entities against the migrated schema at startup and refuses to boot if they disagree. Schema changes are always a reviewable file, never a side effect of starting the app.

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
| Repository (`@DataJpaTest`) | The generated SQL, against real MySQL |
| Integration (`@SpringBootTest`) | Full journeys over HTTP with real tokens |

The repository and integration layers run against MySQL in Testcontainers, so **Docker must be running** for the whole suite to execute. Without Docker they skip rather than fail, which means a green build on a machine with no Docker has not tested those layers.

The integration suite includes an adversarial one: two users register, and one tries to read, edit, and delete the other's data through every endpoint that accepts an id.

## The frontend

`ui/` is set up but empty of real work: React 19, Vite, TypeScript, and Electron are wired together, and `npm run electron:dev` opens a window showing the default Vite template.

Two things worth knowing before building it:

- The API allows browser requests from origins listed in `CORS_ALLOWED_ORIGINS`, which defaults to the Vite dev server at `http://localhost:5173`. Dev works out of the box.
- A **packaged** Electron app loads from `file://`, which sends `Origin: null` and will not match that allowlist. Serving the renderer over a custom protocol, or routing API calls through the main process, avoids the problem. Worth deciding early.

## Roadmap

Backend:

- Pagination and sorting on the task list
- Logout and refresh-token revocation
- Rate limiting on the auth endpoints
- Dockerfile and a deployment target

Frontend:

- Everything: auth screens, task views, categories, subtask checklists, offline behaviour

## License

[MIT](LICENSE) © DreadVoice
