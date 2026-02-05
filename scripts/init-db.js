const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function main() {
    console.log('🔄 Initializing Database...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        // Create DB if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'agenda_crm'}\``);
        await connection.query(`USE \`${process.env.DB_NAME || 'agenda_crm'}\``);

        // Read Schema
        const schemaPath = path.join(__dirname, '../schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Exec Schema
        await connection.query(schema);

        console.log('✅ Database initialized successfully!');

        // Create Admin User manually if needed here, or explain in README
        console.log('ℹ️  Remember to insert an admin user directly into the users table if you haven\'t yet.');
        console.log('   INSERT INTO users (email, password) VALUES (\'admin@admin.com\', \'$2a$10$...\');');

    } catch (error) {
        console.error('❌ Error initializing database:', error);
    } finally {
        await connection.end();
    }
}

main();
