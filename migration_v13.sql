ALTER TABLE procedures ADD COLUMN color VARCHAR(20) NULL;
UPDATE procedures SET color = '#ee2b7c' WHERE color IS NULL;
