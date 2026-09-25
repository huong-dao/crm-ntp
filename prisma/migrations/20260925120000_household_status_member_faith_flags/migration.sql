-- AlterTable
ALTER TABLE `households` ADD COLUMN `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE `members` ADD COLUMN `is_trusted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_ntp_per` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `households_status_idx` ON `households`(`status`);

-- Backfill: hộ không còn thành viên "active" nào thì chuyển "inactive"
UPDATE `households` h
SET h.`status` = 'inactive'
WHERE NOT EXISTS (
    SELECT 1 FROM `members` m
    WHERE m.`household_id` = h.`id` AND m.`status` = 'active'
);
