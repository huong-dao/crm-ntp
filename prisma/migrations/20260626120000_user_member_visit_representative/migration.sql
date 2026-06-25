-- AlterTable
ALTER TABLE `users` ADD COLUMN `member_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_member_id_key` ON `users`(`member_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `visit_requests` ADD COLUMN `representative_member_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `visit_requests_representative_member_id_idx` ON `visit_requests`(`representative_member_id`);

-- AddForeignKey
ALTER TABLE `visit_requests` ADD CONSTRAINT `visit_requests_representative_member_id_fkey` FOREIGN KEY (`representative_member_id`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
