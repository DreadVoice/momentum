# Momentum

A task manager built as a full-stack project: a Spring Boot REST API paired with an Electron +
React desktop client.

**The backend is complete and tested. The desktop client has not been built yet** — `ui/` holds a
scaffolded Vite + React + Electron shell that still shows the starter template. Everything in the
API is exercised through tests and HTTP, not through a user interface.

Momentum lets you keep tasks, sort them into categories, break them into subtasks, and see what's
overdue. Accounts are isolated: your data is yours, and the API is built so that no request can
reach across that line.

---

## Status

| Part | State |
|---|---|
| REST API | Done — auth, accounts, tasks, subtasks, categories |
| Authentication | Done — stateless JWT with access and refresh tokens |
| Database + migrations | Done — MySQL with Flyway |
| Tests | 171, across unit, slice, and container-backed integration |
| Desktop client | **Not started** — scaffolding only |
| Deployment | Not set up |

Full API reference and architecture notes: **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)**.

---

## Repository layout

```
momentum
├── app                  Spring Boot backend (Java 21, Maven)
├── ui                   Electron + React client — scaffolding only, not implemented
├── docker-compose.yml   MySQL for local development
└── .env.example         Template for the environment variables the app needs
```

---

## Running the backend

You need **JDK 21** and **Docker**.

**1. Configure the environment.** Copy the template and fill it in:

```bash
cp .env.example .env
```

`.env` is gitignored — keep it that way. `JWT_SECRET` must be at least 32 characters or the app
refuses to start. `DB_PASSWORD` becomes the MySQL container's root password on first run.

**2. Start the database.**

```bash
docker compose up -d
```

MySQL comes up on port **3308** (3306 and 3307 are commonly taken by other installs; change
`DB_PORT` if 3308 is busy too).

**3. Run the app.**

```bash
cd app
./mvnw spring-boot:run
```

Flyway builds the schema on first boot. The API is then on `http://localhost:8080`.

**4. Check it works.**

```bash
curl localhost:8080/api/health

curl -X POST localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"you","email":"you@example.com","password":"password123"}'
```

Take the `accessToken` from that response and use it:

```bash
curl localhost:8080/api/health/me -H "Authorization: Bearer <accessToken>"
```

If that returns your user id, authentication is working end to end.

---

## Tests

```bash
cd app
./mvnw test
```

Repository and integration tests run against real MySQL via Testcontainers, so **Docker must be
running** for the whole suite to execute. Without Docker they skip rather than fail — which means
a green build on a machine with no Docker has not tested those layers.

---

## The frontend

`ui/` is set up but empty of real work: React 19, Vite, TypeScript, and Electron are wired
together, and `npm run electron:dev` opens a window showing the default Vite template.

Two things worth knowing before building it:

- The API allows browser requests from origins listed in `CORS_ALLOWED_ORIGINS`, which defaults to
  the Vite dev server at `http://localhost:5173`. Dev works out of the box.
- A **packaged** Electron app loads from `file://`, which sends `Origin: null` and will not match
  that allowlist. Serving the renderer over a custom protocol, or routing API calls through the
  main process, avoids the problem. Worth deciding early.

---

## Roadmap

Backend:

- Pagination and sorting on the task list
- Logout and refresh-token revocation
- Rate limiting on the auth endpoints
- OpenAPI documentation
- Dockerfile and a deployment target

Frontend:

- Everything — auth screens, task views, categories, subtask checklists, offline behaviour

---

## License

[MIT](LICENSE) © DreadVoice
