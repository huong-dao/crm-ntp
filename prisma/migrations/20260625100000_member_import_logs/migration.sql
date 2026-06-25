-- CreateTable
CREATE TABLE `member_import_logs` (
    `id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `uploaded_by_id` VARCHAR(191) NOT NULL,
    `uploaded_by_name` VARCHAR(191) NOT NULL,
    `column_headers` JSON NOT NULL,
    `total_rows` INTEGER NOT NULL DEFAULT 0,
    `success_count` INTEGER NOT NULL DEFAULT 0,
    `error_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `member_import_logs_created_at_idx`(`created_at`),
    INDEX `member_import_logs_uploaded_by_id_idx`(`uploaded_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member_import_log_rows` (
    `id` VARCHAR(191) NOT NULL,
    `log_id` VARCHAR(191) NOT NULL,
    `row_number` INTEGER NOT NULL,
    `status` ENUM('success', 'failed') NOT NULL,
    `member_code` VARCHAR(191) NULL,
    `member_id` VARCHAR(191) NULL,
    `error` TEXT NULL,
    `row_data` JSON NOT NULL,
    `retried_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `member_import_log_rows_log_id_idx`(`log_id`),
    INDEX `member_import_log_rows_log_id_status_idx`(`log_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `member_import_log_rows` ADD CONSTRAINT `member_import_log_rows_log_id_fkey` FOREIGN KEY (`log_id`) REFERENCES `member_import_logs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
