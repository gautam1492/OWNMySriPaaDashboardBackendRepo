-- Service catalogue entries describe a service only. The transaction amount remains on ServiceSale.
ALTER TABLE `Service` DROP COLUMN `amount`;
