# Momentum

Momentum is a backend-first task management application built with Spring Boot. It provides a structured REST API for managing users, tasks, categories, and subtasks while following a layered architecture that separates business logic, persistence, data transfer objects, and exception handling.

The project is designed with maintainability and extensibility in mind, serving as a foundation for a full-stack productivity application.

## Features

Currently implemented:

* User domain model
* Task management domain
* Category management
* Subtask management
* Layered service architecture
* Repository abstraction using Spring Data JPA
* DTO-based API design
* Global exception handling
* JWT-ready authentication architecture
* Validation-ready request/response models

## Project Structure

```text
src/main/java/com/momentum/app
├── config          # Application configuration
├── controller      # REST controllers
├── dto             # Request and response DTOs
│   ├── auth
│   ├── category
│   ├── subtask
│   ├── task
│   └── user
├── entity          # JPA entities
├── enums           # Domain enumerations
├── exception       # Custom exceptions and global handlers
├── repository      # Spring Data JPA repositories
├── security        # Authentication and security components
├── service         # Service interfaces
│   └── impl        # Service implementations
```

## Architecture

Momentum follows a conventional layered architecture.

```text
Client
    │
    ▼
Controller
    │
    ▼
Service Interface
    │
    ▼
Service Implementation
    │
    ▼
Repository
    │
    ▼
Database
```

Business logic is isolated from persistence, while DTOs provide a stable contract between the API and clients.

## Domain Model

The current backend consists of the following core entities:

* User
* Task
* Category
* SubTask

The application models the relationships between these entities to support organization of personal tasks and their associated subtasks and categories.

## Technology Stack

* Java
* Spring Boot
* Spring Data JPA
* Spring Security
* JWT Authentication
* Maven
* MySQL
* Lombok
* Hibernate

## Development Status

The backend foundation has been established and currently includes:

* Domain entities
* Repository layer
* Service layer
* DTOs
* Custom exception handling
* Security scaffolding

The following components are still under active development:

* REST controllers
* Authentication endpoints
* Frontend client
* API documentation
* Automated testing

## Building

Clone the repository.

```bash
git clone https://github.com/DreadVoice/momentum.git
```

Navigate into the project.

```bash
cd momentum
```

Build using Maven.

```bash
mvn clean install
```

Run the application.

```bash
mvn spring-boot:run
```

## Configuration

Application configuration is managed through `application.properties`.

A MySQL database must be configured before running the application.

Typical properties include:

* Database URL
* Username
* Password
* JPA configuration
* JWT configuration (when authentication is completed)

## Design Principles

Momentum is built around several architectural principles:

* Separation of concerns
* DTO-based API boundaries
* Repository pattern
* Service-oriented business logic
* Global exception handling
* Extensible package organization
* Clear domain modelling

## Roadmap

Planned work includes:

* Complete REST API implementation
* JWT authentication flow
* User registration and login
* Task filtering and searching
* Pagination and sorting
* Input validation
* Unit and integration testing
* OpenAPI documentation
* Docker support
* Frontend implementation

## License

No license has been specified for this repository.
