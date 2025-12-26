ALTER TABLE `settings` ADD `xendit_enabled` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `settings` ADD `xendit_secret_key` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `xendit_verification_token` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `xendit_environment` text DEFAULT 'sandbox';