-- CreateTable
CREATE TABLE `departments` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `min_age` INTEGER NULL,
    `max_age` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `departments_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add FK columns to members
ALTER TABLE `members` ADD COLUMN `age_department_id` VARCHAR(191) NULL;
ALTER TABLE `members` ADD COLUMN `actual_department_id` VARCHAR(191) NULL;

-- Danh mục ban ngành chuẩn (khớp actual_department trên server)
INSERT INTO `departments` (`id`, `name`, `created_at`) VALUES
  (CONCAT('migr_', MD5('Tráng Niên')), 'Tráng Niên', CURRENT_TIMESTAMP(3)),
  (CONCAT('migr_', MD5('Trung Niên')), 'Trung Niên', CURRENT_TIMESTAMP(3)),
  (CONCAT('migr_', MD5('Cao Niên')), 'Cao Niên', CURRENT_TIMESTAMP(3)),
  (CONCAT('migr_', MD5('Thanh Tráng')), 'Thanh Tráng', CURRENT_TIMESTAMP(3)),
  (CONCAT('migr_', MD5('Thiếu Nhi')), 'Thiếu Nhi', CURRENT_TIMESTAMP(3)),
  (CONCAT('migr_', MD5('Thiếu Niên')), 'Thiếu Niên', CURRENT_TIMESTAMP(3)),
  (CONCAT('migr_', MD5('Thanh Niên')), 'Thanh Niên', CURRENT_TIMESTAMP(3));

-- Thêm ban ngành phát sinh từ dữ liệu cũ (biến thể / lỗi chính tả chưa có trong danh mục)
INSERT INTO `departments` (`id`, `name`, `created_at`)
SELECT CONCAT('migr_', MD5(`name`)), `name`, CURRENT_TIMESTAMP(3)
FROM (
    SELECT DISTINCT `actual_department` AS `name` FROM `members` WHERE `actual_department` IS NOT NULL AND TRIM(`actual_department`) <> ''
    UNION
    SELECT DISTINCT `age_department` AS `name` FROM `members` WHERE `age_department` IS NOT NULL AND TRIM(`age_department`) <> ''
) AS `dept_names`
WHERE `name` NOT IN (
  'Tráng Niên', 'Trung Niên', 'Cao Niên', 'Thanh Tráng',
  'Thiếu Nhi', 'Thiếu Niên', 'Thanh Niên'
);

UPDATE `members` AS `m`
INNER JOIN `departments` AS `d` ON `d`.`name` = `m`.`actual_department`
SET `m`.`actual_department_id` = `d`.`id`
WHERE `m`.`actual_department` IS NOT NULL;

UPDATE `members` AS `m`
INNER JOIN `departments` AS `d` ON `d`.`name` = `m`.`age_department`
SET `m`.`age_department_id` = `d`.`id`
WHERE `m`.`age_department` IS NOT NULL;

-- Drop old string columns
ALTER TABLE `members` DROP COLUMN `age_department`;
ALTER TABLE `members` DROP COLUMN `actual_department`;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_age_department_id_fkey` FOREIGN KEY (`age_department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `members` ADD CONSTRAINT `members_actual_department_id_fkey` FOREIGN KEY (`actual_department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `members_age_department_id_idx` ON `members`(`age_department_id`);
CREATE INDEX `members_actual_department_id_idx` ON `members`(`actual_department_id`);
