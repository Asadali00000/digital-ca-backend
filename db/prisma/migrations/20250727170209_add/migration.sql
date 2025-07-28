-- AlterTable
ALTER TABLE `compliance_alerts` ADD COLUMN `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM';
