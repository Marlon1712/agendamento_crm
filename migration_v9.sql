ALTER TABLE procedures ADD COLUMN promo_type ENUM('discount', 'combo', 'gift') DEFAULT 'discount';
ALTER TABLE procedures ADD COLUMN promo_gift_item VARCHAR(255) DEFAULT NULL;
