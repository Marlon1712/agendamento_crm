ALTER TABLE expenses
  ADD COLUMN type ENUM('expense', 'income') DEFAULT 'expense';
