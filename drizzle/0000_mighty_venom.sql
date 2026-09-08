CREATE TABLE `points` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`description` text NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`airbnb` text,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
