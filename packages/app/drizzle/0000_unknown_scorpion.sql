CREATE TABLE `posts` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	PRIMARY KEY(`id`, `user_id`)
);
