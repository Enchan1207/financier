-- Migration number: 0009 	 2025-04-30T06:01:04.821Z

DROP TABLE IF EXISTS income_records;

CREATE TABLE income_records (
    user_id TEXT NOT NULL,

    financial_month_id TEXT NOT NULL,
    definition_id TEXT NOT NULL,

    value INT NOT NULL,

    updated_at INT NOT NULL,
    updated_by TEXT NOT NULL,

    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
    FOREIGN KEY(financial_month_id) REFERENCES financial_months(id) ON DELETE RESTRICT
    FOREIGN KEY(definition_id) REFERENCES income_definitions(id) ON DELETE RESTRICT

    PRIMARY KEY(financial_month_id, definition_id)
);
