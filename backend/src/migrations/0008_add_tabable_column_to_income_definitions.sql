-- Migration number: 0008 	 2025-04-27T13:26:38.534Z

-- income_definitionsテーブルにis_taxableカラムを追加する
ALTER TABLE income_definitions
ADD COLUMN is_taxable BOOLEAN NOT NULL DEFAULT true;
