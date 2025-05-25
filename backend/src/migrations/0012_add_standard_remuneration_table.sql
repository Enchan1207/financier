-- Migration number: 0012 	 2025-05-25T09:00:50.966Z
CREATE TABLE standard_remunerations (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    table_id TEXT NOT NULL,
    min INT NOT NULL,
    value INT NOT NULL,
);
