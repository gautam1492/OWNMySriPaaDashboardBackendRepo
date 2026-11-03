-- Add mobileNumber column to User (nullable, no data impact on existing users)
ALTER TABLE `User` ADD COLUMN `mobileNumber` VARCHAR(30) NULL;
