-- AlterTable
ALTER TABLE `visit_requests` ADD COLUMN `visit_type` ENUM('at_home', 'at_church', 'phone', 'other') NOT NULL DEFAULT 'at_home',
    ADD COLUMN `status_note` TEXT NULL,
    ADD COLUMN `created_by_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `visit_requests_created_by_id_idx` ON `visit_requests`(`created_by_id`);

-- AddForeignKey
ALTER TABLE `visit_requests` ADD CONSTRAINT `visit_requests_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE `visit_request_histories` (
    `id` VARCHAR(191) NOT NULL,
    `visit_request_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `visit_request_histories_visit_request_id_idx`(`visit_request_id`),
    INDEX `visit_request_histories_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `visit_request_histories` ADD CONSTRAINT `visit_request_histories_visit_request_id_fkey` FOREIGN KEY (`visit_request_id`) REFERENCES `visit_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_request_histories` ADD CONSTRAINT `visit_request_histories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
