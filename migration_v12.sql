-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    category VARCHAR(50) DEFAULT 'Outros', -- e.g., 'Aluguel', 'Produtos', 'Contas'
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_day INT NULL, -- Day of the month (1-31) for recurrence
    user_id INT NULL, -- Optional: link to who registered it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
