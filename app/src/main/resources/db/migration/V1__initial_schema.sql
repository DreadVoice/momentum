CREATE TABLE users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    username      VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password      VARCHAR(60)  NOT NULL,
    profile_photo VARCHAR(255) NULL,
    created_at    DATETIME(6)  NULL,
    updated_at    DATETIME(6)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE = InnoDB;

CREATE TABLE categories (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(255) NOT NULL,
    created_at DATETIME(6)  NULL,
    user_id    BIGINT       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_categories_name_user UNIQUE (name, user_id),
    CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE tasks (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    title        VARCHAR(255)  NOT NULL,
    description  VARCHAR(1000) NULL,
    status       VARCHAR(255)  NOT NULL,
    priority     VARCHAR(255)  NOT NULL,
    due_date     DATE          NULL,
    created_at   DATETIME(6)   NULL,
    updated_at   DATETIME(6)   NULL,
    completed_at DATETIME(6)   NULL,
    user_id      BIGINT        NOT NULL,
    category_id  BIGINT        NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_tasks_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE = InnoDB;

CREATE TABLE subtasks (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    title        VARCHAR(255) NOT NULL,
    is_completed BIT(1)       NOT NULL,
    completed_at DATETIME(6)  NULL,
    task_id      BIGINT       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_subtasks_task FOREIGN KEY (task_id) REFERENCES tasks (id)
) ENGINE = InnoDB;

CREATE INDEX idx_tasks_user_status ON tasks (user_id, status);
CREATE INDEX idx_tasks_user_priority ON tasks (user_id, priority);
CREATE INDEX idx_tasks_user_due_date ON tasks (user_id, due_date);
CREATE INDEX idx_tasks_category ON tasks (category_id);
CREATE INDEX idx_subtasks_task ON subtasks (task_id);
