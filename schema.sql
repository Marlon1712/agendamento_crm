CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS procedures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    is_promotional BOOLEAN DEFAULT FALSE,
    promo_price DECIMAL(10, 2) DEFAULT NULL,
    promo_end_date DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    end_time TIME, -- Can be null for legacy/migrated, but should be filled
    procedure_id INT,
    status ENUM('agendado', 'realizado', 'cancelado', 'pendente') DEFAULT 'pendente',
    is_promo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE SET NULL,
    INDEX idx_date (appointment_date)
);

CREATE TABLE IF NOT EXISTS schedule_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week INT NOT NULL, -- 0-6
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

CREATE TABLE IF NOT EXISTS configuracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value TEXT
);

-- Seed Defaults
INSERT IGNORE INTO configuracoes (setting_key, setting_value) VALUES ('slot_duration', '60');

-- Default Schedule (Mon-Fri 9-18)
INSERT IGNORE INTO schedule_rules (day_of_week, start_time, end_time) VALUES
(1, '09:00', '18:00'),
(2, '09:00', '18:00'),
(3, '09:00', '18:00'),
(4, '09:00', '18:00'),
(5, '09:00', '18:00');

-- Seed Procedures if empty
INSERT IGNORE INTO procedures (name, duration_minutes, price) VALUES
('Manicure Simples', 60, 30.00),
('Pedicure Simples', 60, 30.00),
('Pé e Mão', 120, 55.00);
