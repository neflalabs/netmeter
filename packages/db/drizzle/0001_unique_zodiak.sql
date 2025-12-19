PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`singleton` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`monthly_fee` integer DEFAULT 0 NOT NULL,
	`admin_phone_number` text DEFAULT '' NOT NULL,
	`app_title` text DEFAULT 'NetMeter',
	`app_subtitle` text DEFAULT 'Cara baru patungan WiFi',
	`app_url` text DEFAULT '',
	`listing_per_home` integer DEFAULT 6 NOT NULL,
	`bill_template` text DEFAULT 'Assalamualaikum {name}, patungan bulan {month} / {year} sebesar Rp. {amount} sudah bisa dibayar.{br} Untuk membayar secara otomatis, klik di sini: {link} {br}{br} Pesan ini dikirim otomatis oleh aplikasi.',
	`payment_template` text DEFAULT 'Assalamualaikum {name}, patungan sebesar Rp. {amount} via {method} sudah diterima. detailnya bisa cek disini : {link} {br} Maturnuwun! {br}{br} Pesan ini dikirim otomatis oleh aplikasi.',
	`reminder_template` text DEFAULT 'Assalamualaikum {name}, sekadar mengingatkan patungan WiFi bulan {month} / {year} sebesar Rp. {amount} belum lunas. Jika sudah bayar, abaikan pesan ini: {link} {br}{br} Pesan ini dikirim otomatis oleh aplikasi.',
	`global_due_day` integer DEFAULT 10,
	`global_reminder_interval` integer DEFAULT 3,
	`wa_enabled` integer DEFAULT false,
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
	`manual_payment_details` text DEFAULT 'Tidak ingin menggunakan pembayaran otomatis? Silakan lakukan pembayaran tunai dengan menghubungi admin.',
	`qris_static_image` text,
	`midtrans_enabled` integer DEFAULT false,
	`midtrans_server_key` text,
	`midtrans_client_key` text,
	`midtrans_environment` text DEFAULT 'sandbox',
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_settings`("singleton", "monthly_fee", "admin_phone_number", "app_title", "app_subtitle", "app_url", "listing_per_home", "bill_template", "payment_template", "reminder_template", "global_due_day", "global_reminder_interval", "wa_enabled", "auto_notify_new_bill", "auto_notify_payment_success", "auto_reminder_enabled", "reminder_time", "auto_bill_time", "quiet_hours_start", "quiet_hours_end", "quiet_hours_weekend", "manual_payment_enabled", "qris_payment_enabled", "manual_payment_details", "qris_static_image", "midtrans_enabled", "midtrans_server_key", "midtrans_client_key", "midtrans_environment", "updated_at") SELECT "singleton", "monthly_fee", "admin_phone_number", "app_title", "app_subtitle", "app_url", "listing_per_home", "bill_template", "payment_template", "reminder_template", "global_due_day", "global_reminder_interval", "wa_enabled", "auto_notify_new_bill", "auto_notify_payment_success", "auto_reminder_enabled", "reminder_time", "auto_bill_time", "quiet_hours_start", "quiet_hours_end", "quiet_hours_weekend", "manual_payment_enabled", "qris_payment_enabled", "manual_payment_details", "qris_static_image", "midtrans_enabled", "midtrans_server_key", "midtrans_client_key", "midtrans_environment", "updated_at" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;