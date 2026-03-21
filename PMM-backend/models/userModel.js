const { getDb } = require('../database/db');

async function findUserByEmail(emailid) {
    const db = await getDb();
    return await db.get('SELECT * FROM users WHERE emailid = ?', [emailid]);
}

async function createUser(userData) {
    const db = await getDb();
    const { emailid, subscription_start, subscription_type } = userData;
    await db.run(
        `INSERT INTO users (emailid, subscription_start, subscription_type) VALUES (?, ?, ?)`,
        [emailid, subscription_start, subscription_type || 'Basic']
    );
    return await findUserByEmail(emailid);
}

module.exports = { findUserByEmail, createUser };
