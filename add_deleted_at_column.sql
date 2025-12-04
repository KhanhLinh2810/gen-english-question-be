-- Check if column exists first, then add if it doesn't
-- Run this query to check:
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exam_attempts' AND COLUMN_NAME = 'deleted_at';

-- If the above query returns no rows, then run this:
ALTER TABLE exam_attempts 
ADD COLUMN deleted_at DATETIME NULL;

