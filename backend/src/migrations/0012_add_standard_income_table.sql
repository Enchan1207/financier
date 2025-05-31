-- Migration number: 0012 	 2025-05-25T09:00:50.966Z
CREATE TABLE standard_income_tables (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
);

CREATE TABLE standard_income_grades (
    income_table_id TEXT NOT NULL,
    threshold INTEGER NOT NULL,
    standard_income INTEGER NOT NULL,
    FOREIGN KEY (income_table_id) REFERENCES standard_income_tables (id) ON DELETE RESTRICT,
    PRIMARY KEY (income_table_id, standard_income)
);
