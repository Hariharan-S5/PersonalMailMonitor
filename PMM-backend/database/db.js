const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'pmm_database.sqlite');

let db;

async function getDb() {
    if (!db) {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Initialize table if it doesn't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                emailid TEXT PRIMARY KEY,
                subscription_type TEXT DEFAULT 'Basic',
                visual_mode TEXT DEFAULT 'Light',
                signature_accent TEXT DEFAULT 'SkyBlue',
                compact_mode BOOLEAN DEFAULT 0,
                glass_layers BOOLEAN DEFAULT 0,
                push_alerts BOOLEAN DEFAULT 0,
                subscription_start INTEGER
            );
            
            CREATE TABLE IF NOT EXISTS luck_copan (
                emailid TEXT PRIMARY KEY,
                subscription_type TEXT DEFAULT 'Elite',
                visual_mode TEXT DEFAULT 'Light',
                signature_accent TEXT DEFAULT 'SkyBlue',
                compact_mode BOOLEAN DEFAULT 0,
                glass_layers BOOLEAN DEFAULT 0,
                push_alerts BOOLEAN DEFAULT 0,
                subscription_start INTEGER
            );
        `);
    }
    return db;
}

module.exports = { getDb };
