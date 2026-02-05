-- Add new columns to users table
ALTER TABLE users ADD COLUMN name VARCHAR(255);
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN role ENUM('admin', 'client') DEFAULT 'client';

-- Make password nullable because Google Auth users might not have a password initially
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;

-- Link leads to users
ALTER TABLE leads ADD COLUMN user_id INT;
ALTER TABLE leads ADD CONSTRAINT fk_leads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
