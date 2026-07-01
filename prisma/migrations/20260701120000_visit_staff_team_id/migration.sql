-- AlterTable
ALTER TABLE `members` ADD COLUMN `visit_staff_team_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `members_visit_staff_team_id_idx` ON `members`(`visit_staff_team_id`);

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_visit_staff_team_id_fkey` FOREIGN KEY (`visit_staff_team_id`) REFERENCES `visit_teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
