-- Migration number: 0010 	 2025-05-06T01:02:35.267Z
DROP TABLE IF EXISTS workdays;

CREATE TABLE workdays (
    user_id TEXT NOT NULL,
    financial_month_id TEXT PRIMARY KEY NOT NULL,
    count INT NOT NULL,
    updated_at INT NOT NULL,
    FOREIGN KEY (financial_month_id) REFERENCES financial_months (id) ON DELETE RESTRICT
);
