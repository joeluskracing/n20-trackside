CREATE TABLE `ai_usage` (
	`bucket` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `attachments_owner` ON `attachments` (`owner`);--> statement-breakpoint
CREATE TABLE `preferences` (
	`owner` text PRIMARY KEY NOT NULL,
	`encrypted_key` text,
	`model` text DEFAULT 'gpt-4.1-mini' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`owner` text NOT NULL,
	`revision` integer NOT NULL,
	`csv` text NOT NULL,
	`source` text NOT NULL,
	`message` text NOT NULL,
	`summary` text NOT NULL,
	`changes` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `revisions_session_number` ON `revisions` (`session_id`,`revision`);--> statement-breakpoint
CREATE INDEX `revisions_owner_session` ON `revisions` (`owner`,`session_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`track` text NOT NULL,
	`name` text NOT NULL,
	`date` text NOT NULL,
	`revision` integer NOT NULL,
	`csv` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_owner_date` ON `sessions` (`owner`,`date`);