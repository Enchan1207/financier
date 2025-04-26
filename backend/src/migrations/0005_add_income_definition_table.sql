-- Migration number: 0005 	 2025-04-26T13:46:49.566Z

CREATE TABLE income_definitions (
    id TEXT PRIMARY KEY NOT NULL,

    user_id TEXT NOT NULL,

    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    value INT NOT NULL,

    enabled_at INT NOT NULL,
    disabled_at INT NOT NULL,
    updated_at INT NOT NULL,
);
