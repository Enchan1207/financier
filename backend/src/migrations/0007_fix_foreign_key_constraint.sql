-- Migration number: 0007 	 2025-04-27T13:06:44.324Z

-- 所詮個人プロジェクトなので、ここでは潔くDROPする

-- 0003
DROP TABLE IF EXISTS financial_months;
CREATE TABLE financial_months (
    id TEXT PRIMARY KEY NOT NULL,

    user_id TEXT NOT NULL,

    financial_year INT NOT NULL,
    month INT NOT NULL,

    started_at INT NOT NULL,
    ended_at INT NOT NULL,

    UNIQUE(user_id, financial_year, month)
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- 0004
DROP TABLE IF EXISTS workdays;
CREATE TABLE workdays (
    id TEXT PRIMARY KEY NOT NULL,

    user_id TEXT NOT NULL,

    financial_month_id TEXT NOT NULL,
    count INT NOT NULL,

    updated_at INT NOT NULL,

    FOREIGN KEY(financial_month_id) REFERENCES financial_months(id) ON DELETE RESTRICT
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- 0005
DROP TABLE IF EXISTS income_definitions;
CREATE TABLE income_definitions (
    id TEXT PRIMARY KEY NOT NULL,

    user_id TEXT NOT NULL,

    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    value INT NOT NULL,

    enabled_at INT NOT NULL,
    disabled_at INT NOT NULL,
    updated_at INT NOT NULL,

    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
);
