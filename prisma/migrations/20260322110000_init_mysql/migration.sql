-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(191) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_teams` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `leader_member_id` VARCHAR(191) NULL,
    `area` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visit_teams_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `households` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `head_member_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `households_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `members` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `status` ENUM('active', 'inactive', 'transferred', 'deceased') NOT NULL DEFAULT 'active',
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `house_number` VARCHAR(191) NULL,
    `street` VARCHAR(191) NULL,
    `old_ward` VARCHAR(191) NULL,
    `old_district` VARCHAR(191) NULL,
    `old_province` VARCHAR(191) NULL,
    `old_full_address` VARCHAR(191) NULL,
    `new_ward` VARCHAR(191) NULL,
    `new_province` VARCHAR(191) NULL,
    `new_full_address` VARCHAR(191) NULL,
    `mobile_1` VARCHAR(191) NULL,
    `mobile_2` VARCHAR(191) NULL,
    `landline` VARCHAR(191) NULL,
    `birth_year` INTEGER NULL,
    `gender` ENUM('male', 'female') NULL,
    `occupation` VARCHAR(191) NULL,
    `household_id` VARCHAR(191) NULL,
    `is_head` BOOLEAN NOT NULL DEFAULT false,
    `relationship` VARCHAR(191) NULL,
    `is_baptized` BOOLEAN NOT NULL DEFAULT false,
    `baptism_year` INTEGER NULL,
    `age_department` VARCHAR(191) NULL,
    `actual_department` VARCHAR(191) NULL,
    `board_service_date` DATETIME(3) NULL,
    `visit_department` VARCHAR(191) NULL,
    `visit_team_id` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `members_code_key`(`code`),
    INDEX `members_household_id_idx`(`household_id`),
    INDEX `members_visit_team_id_idx`(`visit_team_id`),
    INDEX `members_status_idx`(`status`),
    INDEX `members_full_name_idx`(`full_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_requests` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `scheduled_date` DATETIME(3) NOT NULL,
    `actual_date` DATETIME(3) NULL,
    `status` ENUM('pending', 'completed', 'cancelled', 'postponed') NOT NULL DEFAULT 'pending',
    `content` TEXT NULL,
    `staff_codes` VARCHAR(191) NULL,
    `household_id` VARCHAR(191) NOT NULL,
    `visit_team_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visit_requests_code_key`(`code`),
    INDEX `visit_requests_household_id_idx`(`household_id`),
    INDEX `visit_requests_visit_team_id_idx`(`visit_team_id`),
    INDEX `visit_requests_status_idx`(`status`),
    INDEX `visit_requests_scheduled_date_idx`(`scheduled_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_household_id_fkey` FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_visit_team_id_fkey` FOREIGN KEY (`visit_team_id`) REFERENCES `visit_teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_requests` ADD CONSTRAINT `visit_requests_household_id_fkey` FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_requests` ADD CONSTRAINT `visit_requests_visit_team_id_fkey` FOREIGN KEY (`visit_team_id`) REFERENCES `visit_teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
