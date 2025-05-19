-- Migration number: 0011 	 2025-05-19T08:03:03.521Z
DROP TABLE IF EXISTS workdays;

-- financial_monthsテーブルにworkdayカラムを追加する
ALTER TABLE financial_months
ADD COLUMN workday INT NOT NULL DEFAULT 20;
