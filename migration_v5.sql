-- Add price column to leads table (Simplified)
-- If it fails because it exists, that's fine for now in dev context, 
-- or we can use a procedure, but let's just try ADD COLUMN direct.
ALTER TABLE leads ADD COLUMN price DECIMAL(10, 2) DEFAULT 0.00;

-- Backfill existing leads with current procedure price
UPDATE leads l
JOIN procedures p ON l.procedure_id = p.id
SET l.price = p.price
WHERE l.price = 0.00;
