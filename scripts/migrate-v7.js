const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

async function main() {
    console.log('🔄 Applying Migration V7...');

    const dbHost = process.env.DB_HOST === 'db' ? '127.0.0.1' : (process.env.DB_HOST || 'localhost');

    const connection = await mysql.createConnection({
        host: dbHost,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'agenda_crm',
        multipleStatements: true
    });

    try {
        const migrationPath = path.join(__dirname, '../migration_v7.sql');
        const migration = fs.readFileSync(migrationPath, 'utf8');

        await connection.query(migration);

        console.log('✅ Migration V7 applied successfully!');

    } catch (error) {
        console.error('❌ Error applying migration:', error);
        // Ignore "Duplicate column name" error code if rerunning
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  Columns already exist, skipping.');
        }
    } finally {
        await connection.end();
    }
}

main();
