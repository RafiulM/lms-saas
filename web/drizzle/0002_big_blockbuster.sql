CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`subscription_id` text,
	`plan` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payment_method` text,
	`mayar_transaction_id` text,
	`mayar_webhook_id` text,
	`paid_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `payments_school_idx` ON `payments` (`school_id`);--> statement-breakpoint
CREATE INDEX `payments_transaction_idx` ON `payments` (`mayar_transaction_id`);