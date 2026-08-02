# Momentum — Backend Overview

This document describes the Momentum REST API: what it does, how it is put together, and why it
is built the way it is. It covers the backend only.

---

## What the API does

Momentum is a personal task manager. Every account owns its own tasks, and those tasks can be
grouped into categories and broken down into subtasks.

There are four ideas in it:

- **User** — an account. Owns everything else.
- **Task** — something to do. Has a title, description, priority, status, and optional due date.
- **Category** — a label for grouping tasks, like "Work" or "Errands". A task may have one.
- **SubTask** — a checklist item inside a task.

```
User
 ├── Categories
 └── Tasks
      ├── (optionally in one Category)
      └── SubTasks
```

Deleting an account deletes its tasks, subtasks, and categories with it. Deleting a task deletes
its subtasks.

---

## How a request flows

```
HTTP request
   │
   ▼
JwtAuthenticationFilter     reads the Bearer token, works out who is calling
   │
   ▼
Controller                  validates the request body, no business logic
   │
   ▼
Service                     the rules live here, including "do you own this?"
   │
   ▼
Repository                  Spring Data JPA
   │
   ▼
MySQL
```

Anything thrown along the way is caught by `GlobalExceptionHandler` and turned into a consistent
JSON error. Controllers contain no `try`/`catch`.

---

## Authentication

Authentication is stateless — there are no sessions on the server. You register or log in, get
two tokens back, and send the access token on every subsequent request.

```
Authorization: Bearer <accessToken>
```

| Token | Lifetime | Purpose |
|---|---|---|
| Access | 15 minutes | Sent with every request |
| Refresh | 7 days | Exchanged at `/api/auth/refresh` for a fresh pair |

Both are signed with HS256. They carry the user's id as the subject and a `type` claim marking
them as access or refresh, and the API refuses a refresh token used in place of an access token.

Passwords are stored as BCrypt hashes and are never returned by any endpoint.

### How ownership works

**No endpoint accepts a user id.** The caller's identity comes only from the verified token, so
there is no field a client could change to reach someone else's data.

When you ask for something that exists but isn't yours, the API returns **404, not 403**. A 403
would confirm the record exists, which tells an attacker something they should not learn. Missing
and not-yours look identical from the outside.

---

## Endpoints

`/api/auth/**` and `GET /api/health` are public. Everything else needs a token.

### Authentication — `/api/auth`

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/register` | `RegisterRequest` | 201 · `AuthResponse` |
| POST | `/login` | `LoginRequest` | 200 · `AuthResponse` |
| POST | `/refresh` | `RefreshTokenRequest` | 200 · `AuthResponse` |

`AuthResponse` is `{ accessToken, refreshToken, username }`.

### Account — `/api/users`

Everything is scoped to `/me`. There is deliberately no `/api/users/{id}`.

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/me` | — | 200 · `UserResponse` |
| PUT | `/me` | `UserUpdateRequest` | 200 · `UserResponse` |
| PATCH | `/me/password` | `ChangePasswordRequest` | 204 |
| DELETE | `/me` | `DeleteAccountRequest` | 204 |

Changing your password and deleting your account both require your current password in the body.
`PUT /me` is a full replace, so a field you leave out is cleared.

### Tasks — `/api/tasks`

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/` | `TaskCreateRequest` | 201 · `TaskResponse` |
| GET | `/` | — | 200 · `TaskResponse[]` |
| GET | `/overdue` | — | 200 · `TaskResponse[]` |
| GET | `/stats` | — | 200 · `TaskStatsResponse` |
| GET | `/{taskId}` | — | 200 · `TaskResponse` |
| PUT | `/{taskId}` | `TaskUpdateRequest` | 200 · `TaskResponse` |
| DELETE | `/{taskId}` | — | 204 |

The list endpoint takes one optional filter:

```
GET /api/tasks?status=COMPLETED
GET /api/tasks?priority=HIGH
GET /api/tasks?categoryId=3
```

Only one at a time. Combining them returns 400 rather than quietly ignoring one, because the API
cannot actually apply both.

"Overdue" means the due date is strictly before today — something due today is not overdue, and a
task with no due date never is.

`TaskStatsResponse` is `{ countsByStatus: { PENDING, IN_PROGRESS, COMPLETED }, total }`.

`TaskResponse` embeds the task's subtasks along with `subTaskCount` and `completedSubTaskCount`,
so rendering a task list needs no follow-up requests.

### Subtasks

Creating and listing happen through the parent task. Once you have a subtask id, you address it
directly.

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/tasks/{taskId}/subtasks` | `SubTaskCreateRequest` | 201 · `SubTaskResponse` |
| GET | `/api/tasks/{taskId}/subtasks` | — | 200 · `SubTaskResponse[]` |
| PUT | `/api/subtasks/{subTaskId}` | `SubTaskUpdateRequest` | 200 · `SubTaskResponse` |
| PATCH | `/api/subtasks/{subTaskId}/toggle` | — | 200 · `SubTaskResponse` |
| DELETE | `/api/subtasks/{subTaskId}` | — | 204 |

Toggling flips completion and stamps or clears `completedAt`.

### Categories — `/api/categories`

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/` | `CategoryCreateRequest` | 201 · `CategoryResponse` |
| GET | `/` | — | 200 · `CategoryResponse[]` |
| GET | `/{categoryId}` | — | 200 · `CategoryResponse` |
| PUT | `/{categoryId}` | `CategoryUpdateRequest` | 200 · `CategoryResponse` |
| DELETE | `/{categoryId}` | — | 204 |

Names are unique per user, so two people can both have "Work" but you cannot have it twice.
`CategoryResponse` includes `taskCount`.

### Health — `/api/health`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | public | Is the service up |
| GET | `/api/health/me` | required | Echoes who the token says you are |

`/me` is useful when wiring up a client: if it returns your id, the whole auth chain works.

---

## Errors

Every error — including ones raised inside the security filters, before any controller runs —
comes back in the same shape:

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

| Status | When |
|---|---|
| 400 | Invalid body, unknown enum value, or conflicting query filters |
| 401 | Missing, expired, or wrong token; bad password |
| 403 | Authenticated but not allowed |
| 404 | Doesn't exist — or isn't yours |
| 409 | Username, email, or category name already taken |
| 500 | Something genuinely unexpected |

---

## Code layout

```
app/src/main/java/com/momentum/app
├── config        SecurityConfig, CorsConfig
├── controller    HTTP only — routing, validation, status codes
├── dto           Request and response records, with validation annotations
├── entity        JPA entities
├── enums         TaskStatus, TaskPriority
├── exception     Custom exceptions and GlobalExceptionHandler
├── repository    Spring Data JPA interfaces
├── security      JWT filter, principal, user lookup, 401/403 handlers
└── service       Interfaces, with implementations in service/impl
```

Two conventions worth knowing:

**Services take a `userId` first.** Every method that touches user data starts with the caller's
id and checks ownership itself, so the guarantee holds no matter who calls the service.

**DTOs are records carrying their own validation rules.** Controllers add `@Valid` and the
framework rejects bad input before any business code runs.

---

## Database

MySQL, with the schema managed by **Flyway** migrations in
`app/src/main/resources/db/migration`. Hibernate runs in `validate` mode: it compares the entities
against the migrated schema at startup and refuses to boot if they disagree. Schema changes are
therefore always a reviewable file, never a silent side effect of starting the app.

To change the schema, add `V{n}__description.sql`. Never edit a migration that has already run.

---

## Testing

171 tests across four layers, each proving something the others cannot:

| Layer | What it proves |
|---|---|
| Service (Mockito) | Business rules and ownership checks |
| Controller (`@WebMvcTest`) | Status codes, validation, the real security filter chain |
| Repository (`@DataJpaTest`) | The generated SQL, against real MySQL |
| Integration (`@SpringBootTest`) | Full journeys over HTTP with real tokens |

The repository and integration layers run against MySQL in **Testcontainers**, so migrations and
queries are exercised on the same database the app uses in production. They need Docker; without
it they skip rather than fail.

The integration suite includes an adversarial one: two users register, and one tries to read,
edit, and delete the other's data through every endpoint that accepts an id.

---

## Stack

| | |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 4.1 |
| Security | Spring Security 7, JJWT |
| Persistence | Spring Data JPA / Hibernate |
| Migrations | Flyway |
| Database | MySQL 8.4 |
| Validation | Jakarta Bean Validation |
| Testing | JUnit 5, Mockito, AssertJ, Testcontainers |
| Build | Maven |

---

## Not built yet

An honest list of what the API does not do:

- **No pagination.** `GET /api/tasks` returns everything you own in one response.
- **No logout or token revocation.** A refresh token stays valid for its full 7 days.
- **No rate limiting.** Login attempts are unthrottled.
- **No search or sorting.**
- **No sharing.** Tasks belong to exactly one account.
- **No file uploads.** `profilePhoto` holds a URL hosted elsewhere.
- **No OpenAPI document.** This file is the API reference.
