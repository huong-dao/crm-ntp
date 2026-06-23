-- Expand enum, migrate values, then apply final status set
ALTER TABLE `visit_requests` MODIFY `status` ENUM('pending', 'completed', 'cancelled', 'postponed', 'scheduled') NOT NULL DEFAULT 'pending';

UPDATE `visit_requests` SET `status` = 'scheduled' WHERE `status` IN ('pending', 'postponed');

ALTER TABLE `visit_requests` MODIFY `status` ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled';
