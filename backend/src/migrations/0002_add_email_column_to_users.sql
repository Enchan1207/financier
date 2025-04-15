-- Migration number: 0002 	 2025-04-14T10:59:58.484Z

-- usersテーブルにemailカラムを追加する
ALTER TABLE users
ADD COLUMN email TEXT NOT NULL DEFAULT '';
