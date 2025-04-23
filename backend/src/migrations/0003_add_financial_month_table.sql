-- Migration number: 0003 	 2025-04-23T05:57:26.828Z

CREATE TABLE financial_months (
    id TEXT PRIMARY KEY NOT NULL,

    user_id TEXT NOT NULL,

    financial_year INT NOT NULL,
    month INT NOT NULL,

    started_at INT NOT NULL,
    ended_at INT NOT NULL,

    unique(user_id, financial_year, month)
);
