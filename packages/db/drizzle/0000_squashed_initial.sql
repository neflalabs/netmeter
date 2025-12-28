CREATE TABLE `bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'UNPAID',
	`payment_token` text NOT NULL,
	`snap_token` text,
	`snap_token_expiry` integer,
	`snap_amount` integer,
	`paid_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bills_payment_token_unique` ON `bills` (`payment_token`);--> statement-breakpoint
CREATE INDEX `idx_bills_user_id` ON `bills` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_bills_status` ON `bills` (`status`);--> statement-breakpoint
CREATE INDEX `idx_bills_month_year` ON `bills` (`month`,`year`);--> statement-breakpoint
CREATE INDEX `idx_bills_payment_token` ON `bills` (`payment_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_month_year` ON `bills` (`user_id`,`month`,`year`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bill_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`method` text NOT NULL,
	`transaction_id` text,
	`payment_type` text,
	`issuer` text,
	`gateway_status` text,
	`currency` text DEFAULT 'IDR',
	`raw_response` text,
	`external_id` text,
	`proof_url` text,
	`status` text DEFAULT 'PENDING',
	`paid_at` integer,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_transaction_id_unique` ON `payments` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_bill_id` ON `payments` (`bill_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_transaction_id` ON `payments` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_status` ON `payments` (`status`);--> statement-breakpoint
CREATE TABLE `settings` (
	`singleton` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`monthly_fee` integer DEFAULT 0 NOT NULL,
	`admin_phone_number` text DEFAULT '' NOT NULL,
	`app_title` text DEFAULT 'NetMeter',
	`app_subtitle` text DEFAULT 'Cara baru patungan WiFi',
	`app_url` text DEFAULT '',
	`listing_per_home` integer DEFAULT 6 NOT NULL,
	`announcement_title` text DEFAULT 'Pengumuman',
	`announcement_message` text DEFAULT '',
	`announcement_type` text DEFAULT 'INFO',
	`announcement_active` integer DEFAULT false,
	`announcement_created_at` integer,
	`announcement_updated_at` integer,
	`bill_template` text,
	`payment_template` text,
	`reminder_template` text,
	`global_due_day` integer DEFAULT 10,
	`global_reminder_interval` integer DEFAULT 3,
	`wa_enabled` integer DEFAULT false,
	`wa_service_url` text,
	`wa_api_key` text,
	`wa_instance_id` text DEFAULT '',
	`wa_webhook_secret` text,
	`auto_notify_new_bill` integer DEFAULT false,
	`auto_notify_payment_success` integer DEFAULT false,
	`auto_reminder_enabled` integer DEFAULT false,
	`reminder_time` text DEFAULT '09:00',
	`auto_bill_time` text DEFAULT '09:00',
	`quiet_hours_start` text DEFAULT '21:00',
	`quiet_hours_end` text DEFAULT '08:00',
	`quiet_hours_weekend` integer DEFAULT true,
	`manual_payment_enabled` integer DEFAULT true,
	`qris_payment_enabled` integer DEFAULT false,
	`manual_payment_details` text DEFAULT 'Pembayaran Tunai masih selalu diterima selama menghubungi admin.',
	`qris_raw_string` text,
	`midtrans_enabled` integer DEFAULT false,
	`midtrans_server_key` text,
	`midtrans_client_key` text,
	`midtrans_environment` text DEFAULT 'sandbox',
	`xendit_enabled` integer DEFAULT false,
	`xendit_secret_key` text,
	`xendit_verification_token` text,
	`xendit_environment` text DEFAULT 'sandbox',
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`whatsapp` text NOT NULL,
	`pppoe_username` text,
	`status` text DEFAULT 'ACTIVE',
	`payment_preference` text DEFAULT 'MANUAL',
	`address` text,
	`device_model` text,
	`notes` text,
	`joined_at` integer,
	`first_connected_at` integer,
	`deleted_at` integer,
	`due_day` integer,
	`reminder_interval` integer,
	`reminder_enabled` integer DEFAULT true,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_pppoe_username_unique` ON `users` (`pppoe_username`);--> statement-breakpoint
CREATE INDEX `idx_users_status` ON `users` (`status`);--> statement-breakpoint
CREATE INDEX `idx_users_whatsapp` ON `users` (`whatsapp`);--> statement-breakpoint
CREATE TABLE `whatsapp_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipient` text NOT NULL,
	`user_id` integer,
	`bill_id` integer,
	`message` text NOT NULL,
	`type` text DEFAULT 'OTHER',
	`status` text DEFAULT 'SENT',
	`wa_message_id` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_logs_wa_message_id_unique` ON `whatsapp_logs` (`wa_message_id`);--> statement-breakpoint
CREATE INDEX `idx_wa_logs_recipient` ON `whatsapp_logs` (`recipient`);--> statement-breakpoint
CREATE INDEX `idx_wa_logs_user_id` ON `whatsapp_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_wa_logs_bill_id` ON `whatsapp_logs` (`bill_id`);--> statement-breakpoint
CREATE INDEX `idx_wa_logs_created_at` ON `whatsapp_logs` (`created_at`);