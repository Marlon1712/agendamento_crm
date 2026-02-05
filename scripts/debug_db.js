const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
    try {
        // Load .env
        const envPath = path.join(__dirname, '../.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) env[key.trim()] = value.trim();
        });

        console.log('DB Config:', {
            host: env.DB_HOST,
            user: env.DB_USER,
            database: env.DB_NAME
        });

        const pool = mysql.createPool({
            host: env.DB_HOST,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            database: env.DB_NAME,
            ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined
        });

        // Check Procedures
        console.log('\n--- PROCEDURES ---');
        const [procedures] = await pool.query('SELECT id, name, duration_minutes, active FROM procedures');
        console.table(procedures);

        // Check Schedule Rules
        console.log('\n--- SCHEDULE RULES ---');
        const [rules] = await pool.query('SELECT day_of_week, start_time, end_time, is_active FROM schedule_rules');
        console.table(rules);

        await pool.end();
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
