-- Migration number: 0004 	 2025-04-23T08:24:26.065Z

CREATE TABLE workdays (
    id TEXT PRIMARY KEY NOT NULL,

    user_id TEXT NOT NULL,

    financial_month_id TEXT NOT NULL,
    count INT NOT NULL,

    updated_at INT NOT NULL,

    FOREIGN KEY(financial_month_id) REFERENCES financial_months(id) ON DELETE RESTRICT
);
