CREATE TABLE IF NOT EXISTS procedures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedule_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS blocked_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blocked_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason VARCHAR(255)
);

-- Update leads table safely
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads' AND COLUMN_NAME = 'procedure_id');
SET @sql := IF(@exist = 0, 'ALTER TABLE leads ADD COLUMN procedure_id INT, ADD COLUMN end_time TIME, ADD FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE SET NULL', 'SELECT "Column procedure_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Seed Data
INSERT IGNORE INTO procedures (name, duration_minutes, price) VALUES
('Manicure Simples', 60, 30.00),
('Pedicure Simples', 60, 30.00),
('Pé e Mão', 120, 55.00);

INSERT IGNORE INTO schedule_rules (day_of_week, start_time, end_time) VALUES
(1, '09:00', '18:00'), (2, '09:00', '18:00'), (3, '09:00', '18:00'), (4, '09:00', '18:00'), (5, '09:00', '18:00');
