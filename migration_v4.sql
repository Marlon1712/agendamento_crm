-- Add display_order column if it doesn't exist
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'procedures' AND COLUMN_NAME = 'display_order');
SET @sql := IF(@exist = 0, 'ALTER TABLE procedures ADD COLUMN display_order INT DEFAULT 0', 'SELECT "Column display_order already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Initialize order based on ID
-- Fixed: Removed JOIN to allow ORDER BY
SET @row_number = 0;
UPDATE procedures SET display_order = (@row_number := @row_number + 1) ORDER BY id ASC;
