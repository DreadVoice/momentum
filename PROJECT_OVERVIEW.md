# Momentum — Project Overview

Momentum is a personal productivity and task management REST API built with **Spring Boot** and **Spring Data JPA**. It provides JWT-based authentication and a full task lifecycle management system with categorisation and subtask tracking.

---

## Domain Model

### Relationships

```
User
 ├── has many Tasks       (cascade delete)
 └── has many Categories  (cascade delete)

Category
 ├── belongs to User
 └── has many Tasks

Task
 ├── belongs to User
 ├── belongs to Category  (optional)
 └── has many SubTasks    (cascade delete, orphan removal)

SubTask
 └── belongs to Task
```

### Entities

#### `User`
| Field       | Type            | Constraints                  |
|-------------|-----------------|------------------------------|
| id          | Long            | PK, auto-generated           |
| username    | String          | unique, not null             |
| email       | String          | unique, not null             |
| password    | String (max 60) | not null (bcrypt hash)       |
| createdAt   | LocalDateTime   | auto-set on creation         |

#### `Category`
| Field     | Type          | Constraints                                   |
|-----------|---------------|-----------------------------------------------|
| id        | Long          | PK, auto-generated                            |
| name      | String        | not null, max 255; unique per user            |
| createdAt | LocalDateTime | auto-set on creation                          |
| user      | User          | FK → users.id, not null                       |

#### `Task`
| Field       | Type          | Constraints                                  |
|-------------|---------------|----------------------------------------------|
| id          | Long          | PK, auto-generated                           |
| title       | String        | not null, max 255                            |
| description | String        | nullable, max 1000                           |
| status      | TaskStatus    | not null, default PENDING                    |
| priority    | TaskPriority  | not null, default MEDIUM                     |
| dueDate     | LocalDate     | nullable                                     |
| createdAt   | LocalDateTime | auto-set on creation                         |
| updatedAt   | LocalDateTime | auto-updated on save                         |
| completedAt | LocalDateTime | nullable, set when task is completed         |
| user        | User          | FK → users.id, not null                      |
| category    | Category      | FK → categories.id, nullable                 |

#### `SubTask`
| Field       | Type          | Constraints                      |
|-------------|---------------|----------------------------------|
| id          | Long          | PK, auto-generated               |
| title       | String        | not null, max 255                |
| completed   | Boolean       | not null                         |
| completedAt | LocalDateTime | nullable                         |
| task        | Task          | FK → tasks.id, not null          |

---

## Enums

| Enum           | Values                          |
|----------------|---------------------------------|
| `TaskStatus`   | `PENDING`, `IN_PROGRESS`, `COMPLETED` |
| `TaskPriority` | `LOW`, `MEDIUM`, `HIGH`         |

---

## API Surface

Endpoints are inferred from DTO comments and request/response shapes.

### Authentication — `/api/auth`
| Method | Path               | Request DTO        | Response DTO    | Description                      |
|--------|--------------------|--------------------|-----------------|----------------------------------|
| POST   | `/api/auth/register` | `RegisterRequest` | —               | Create a new user account        |
| POST   | `/api/auth/login`    | `LoginRequest`    | `AuthResponse`  | Login and receive a JWT token    |

`AuthResponse` returns `{ token, username }`.

### Tasks — `/api/tasks`
| Method | Path              | Request DTO         | Response DTO   | Description                          |
|--------|-------------------|---------------------|----------------|--------------------------------------|
| GET    | `/api/tasks`      | —                   | `TaskResponse[]` | List all tasks for the current user |
| GET    | `/api/tasks/{id}` | —                   | `TaskResponse`   | Get a single task by ID             |
| POST   | `/api/tasks`      | `TaskCreateRequest` | `TaskResponse`   | Create a new task                   |
| PUT    | `/api/tasks/{id}` | `TaskUpdateRequest` | `TaskResponse`   | Update an existing task             |

`TaskResponse` includes embedded `SubTaskResponse[]` and aggregated counts (`subTaskCount`, `completedSubTaskCount`).

### SubTasks — `/api/tasks/{taskId}/subtasks`
| Method | Path                               | Request DTO             | Response DTO      | Description             |
|--------|------------------------------------|-------------------------|-------------------|-------------------------|
| POST   | `/api/tasks/{taskId}/subtasks`     | `SubTaskCreateRequest`  | `SubTaskResponse` | Add a subtask to a task |

### Categories — `/api/categories`
| Method | Path              | Request DTO             | Response DTO       | Description                        |
|--------|-------------------|-------------------------|--------------------|------------------------------------|
| GET    | `/api/categories` | —                       | `CategoryResponse[]` | List all categories for the user |
| POST   | `/api/categories` | `CategoryCreateRequest` | `CategoryResponse`   | Create a new category            |

`CategoryResponse` includes `taskCount` — the number of tasks in that category.

### User Profile — `/api/users`
| Method | Path                        | Request DTO             | Response DTO   | Description                    |
|--------|-----------------------------|-------------------------|----------------|--------------------------------|
| GET    | `/api/users/me`             | —                       | `UserResponse` | Get the current user's profile |
| PUT    | `/api/users/me`             | `UserUpdateRequest`     | `UserResponse` | Update username or email       |
| POST   | `/api/users/me/change-password` | `ChangePasswordRequest` | —          | Change account password        |

---

## Repository Query Capabilities

### `TaskRepository`
- Fetch all tasks by user
- Filter by **status**, **category**, or **priority**
- Find tasks with a due date **before a given date** (overdue queries)
- Count tasks by status (useful for dashboard/stats)

### `SubTaskRepository`
- Fetch all subtasks for a task
- Count total subtasks per task
- Count **completed** subtasks per task

### `CategoryRepository`
- Fetch all categories for a user
- Lookup a category by user + name (for uniqueness enforcement)
- Check existence by user + name

### `UserRepository`
- Lookup by email or username (for login)
- Check existence by email or username (for registration validation)

---

## Technology Stack

| Layer             | Technology                          |
|-------------------|-------------------------------------|
| Language          | Java                                |
| Framework         | Spring Boot                         |
| Persistence       | Spring Data JPA (Hibernate)         |
| Validation        | Jakarta Bean Validation             |
| Boilerplate       | Lombok (builders, getters, setters) |
| Auth (implied)    | JWT (token returned on login)       |

---

## Current Scope

The data layer supports a **single-user-per-account** task manager with the following capabilities:

- Register and authenticate users with JWT
- Create, read, and update tasks with title, description, priority, status, due date, and category
- Break tasks into subtasks with individual completion tracking
- Organise tasks into user-scoped categories
- Query tasks by multiple filters (status, priority, category, overdue)
- Manage user profile (username, email, password)

**Not yet modelled:** task deletion, subtask update/delete, category update/delete, pagination/sorting, sharing tasks between users, notifications, or recurring tasks.
