ALTER TABLE client_notes ADD COLUMN user_id INT NULL;
CREATE UNIQUE INDEX uniq_client_user ON client_notes (user_id);
