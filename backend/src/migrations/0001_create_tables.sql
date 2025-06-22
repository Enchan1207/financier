-- Migration number: 0001 	 2025-06-08T11:49:12.033Z
CREATE TABLE users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    auth0_user_id TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT ''
);

CREATE TABLE financial_years (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    year INT NOT NULL,
    standard_income_table_id TEXT NOT NULL,
    UNIQUE (user_id, financial_year),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    FOREIGN KEY (standard_income_table_id) REFERENCES standard_income_tables (id) ON DELETE RESTRICT
);

CREATE TABLE monthly_contexts (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    financial_year_id TEXT NOT NULL,
    month INT NOT NULL,
    started_at INT NOT NULL,
    ended_at INT NOT NULL,
    workday INT NOT NULL DEFAULT 20,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    FOREIGN KEY (financial_year_id) REFERENCES financial_years (id) ON DELETE RESTRICT,
);

CREATE TABLE definitions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    value INT NOT NULL,
    enabled_at INT NOT NULL,
    disabled_at INT NOT NULL,
    updated_at INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE actuals (
    user_id TEXT NOT NULL,
    monthly_context_id TEXT NOT NULL,
    definition_id TEXT NOT NULL,
    value INT NOT NULL,
    updated_at INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    FOREIGN KEY (monthly_context_id) REFERENCES monthly_contexts (id) ON DELETE RESTRICT,
    FOREIGN KEY (definition_id) REFERENCES income_definitions (id) ON DELETE RESTRICT,
    PRIMARY KEY (monthly_context_id, definition_id)
);

CREATE TABLE standard_income_tables (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE standard_income_grades (
    income_table_id TEXT NOT NULL,
    threshold INTEGER NOT NULL,
    standard_income INTEGER NOT NULL,
    FOREIGN KEY (income_table_id) REFERENCES standard_income_tables (id) ON DELETE RESTRICT,
    PRIMARY KEY (income_table_id, standard_income)
);
