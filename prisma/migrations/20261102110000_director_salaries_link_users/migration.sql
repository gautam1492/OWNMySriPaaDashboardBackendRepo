ALTER TABLE `DirectorSalary`
    DROP FOREIGN KEY `DirectorSalary_directorId_fkey`,
    MODIFY `directorId` VARCHAR(191) NULL,
    ADD COLUMN `directorUserId` VARCHAR(191) NULL,
    ADD COLUMN `directorNameSnapshot` VARCHAR(160) NULL;

UPDATE `DirectorSalary` AS salary
JOIN `Director` AS legacyDirector ON legacyDirector.`id` = salary.`directorId`
SET salary.`directorNameSnapshot` = legacyDirector.`name`;

UPDATE `DirectorSalary` AS salary
JOIN `Director` AS legacyDirector ON legacyDirector.`id` = salary.`directorId`
JOIN (
    SELECT MIN(user.`id`) AS `id`, MIN(user.`name`) AS `name`
    FROM `User` AS user
    JOIN `Role` AS role ON role.`id` = user.`roleId`
    WHERE role.`name` = 'DIRECTOR'
    GROUP BY LOWER(TRIM(user.`name`))
    HAVING COUNT(*) = 1
) AS directorUser ON LOWER(TRIM(directorUser.`name`)) = LOWER(TRIM(legacyDirector.`name`))
SET salary.`directorUserId` = directorUser.`id`,
    salary.`directorNameSnapshot` = directorUser.`name`;

ALTER TABLE `DirectorSalary`
    ADD INDEX `DirectorSalary_directorUserId_idx`(`directorUserId`),
    ADD CONSTRAINT `DirectorSalary_directorId_fkey`
        FOREIGN KEY (`directorId`) REFERENCES `Director`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `DirectorSalary_directorUserId_fkey`
        FOREIGN KEY (`directorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
