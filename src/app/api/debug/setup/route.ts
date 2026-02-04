import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const logs = [];
  try {
    const connection = await pool.getConnection();
    
    // Helper to log and run
    const run = async (query: string, label: string) => {
        try {
            await connection.query(query);
            logs.push(`✅ SUCCESS: ${label}`);
        } catch (e: any) {
            // Ignore "Duplicate column" or "Table exists" warnings
            if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_TABLE_EXISTS_ERROR') {
                 logs.push(`ℹ️ SKIPPED (Exists): ${label}`);
            } else {
                 logs.push(`❌ ERROR ${label}: ${e.message}`);
            }
        }
    };

    try {
        logs.push('🚀 Starting Auto-Fix...');

        // 1. SCHEDULE RULES
        await run(`
            CREATE TABLE IF NOT EXISTS schedule_rules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                day_of_week INT NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                lunch_start TIME NULL,
                lunch_end TIME NULL,
                is_active BOOLEAN DEFAULT TRUE
            )
        `, 'Create schedule_rules table');

        // Add columns if missing (Individual ALTERS for safety)
        await run("ALTER TABLE schedule_rules ADD COLUMN lunch_start TIME NULL", "Add lunch_start");
        await run("ALTER TABLE schedule_rules ADD COLUMN lunch_end TIME NULL", "Add lunch_end");

        // Seed Data
        const [schRows]: any = await connection.query('SELECT COUNT(*) as c FROM schedule_rules');
        if (schRows[0].c === 0) {
            await run(`
                INSERT INTO schedule_rules (day_of_week, start_time, end_time, lunch_start, lunch_end, is_active) VALUES
                (0, '09:00', '18:00', '12:00', '13:00', 0),
                (1, '09:00', '18:00', '12:00', '13:00', 1),
                (2, '09:00', '18:00', '12:00', '13:00', 1),
                (3, '09:00', '18:00', '12:00', '13:00', 1),
                (4, '09:00', '18:00', '12:00', '13:00', 1),
                (5, '09:00', '18:00', '12:00', '13:00', 1),
                (6, '09:00', '18:00', '12:00', '13:00', 1)
            `, 'Seed schedule_rules');
        }

        // 2. PROCEDURES
        await run(`
            CREATE TABLE IF NOT EXISTS procedures (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                observation VARCHAR(255),
                duration_minutes INT NOT NULL,
                price DECIMAL(10, 2) DEFAULT 0.00,
                active BOOLEAN DEFAULT TRUE,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, 'Create procedures table');

        // Add Columns
        await run("ALTER TABLE procedures ADD COLUMN observation VARCHAR(255) NULL", "Add observation");
        await run("ALTER TABLE procedures ADD COLUMN is_promotional BOOLEAN DEFAULT FALSE", "Add is_promotional");
        await run("ALTER TABLE procedures ADD COLUMN promo_price DECIMAL(10, 2) DEFAULT NULL", "Add promo_price");
        await run("ALTER TABLE procedures ADD COLUMN promo_start_date DATE DEFAULT NULL", "Add promo_start_date");
        await run("ALTER TABLE procedures ADD COLUMN promo_end_date DATETIME DEFAULT NULL", "Add promo_end_date");
        await run("ALTER TABLE procedures ADD COLUMN promo_type ENUM('discount', 'gift', 'combo') DEFAULT 'discount'", "Add promo_type");
        await run("ALTER TABLE procedures ADD COLUMN promo_gift_item VARCHAR(255) NULL", "Add promo_gift_item");
        await run("ALTER TABLE procedures ADD COLUMN promo_slots INT DEFAULT NULL", "Add promo_slots");

        logs.push('🏁 Auto-Fix Complete!');
    } finally {
        connection.release();
    }

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, logs }, { status: 500 });
  }
}
