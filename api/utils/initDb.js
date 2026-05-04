require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function initDb() {
    try {
        const schema = fs.readFileSync(path.join(__dirname, '../config/schema.sql'), 'utf8');
        await db.query(schema);
        console.log('✅ Database initialized successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
        process.exit(1);
    }
}

initDb();
