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

async function findLuckUserByEmail(emailid) {
    const db = await getDb();
    return await db.get('SELECT * FROM luck_copan WHERE emailid = ?', [emailid]);
}

async function createLuckUser(userData) {
    const db = await getDb();
    const { emailid, subscription_start, subscription_type, visual_mode, signature_accent, compact_mode, glass_layers, push_alerts } = userData;
    await db.run(
        `INSERT INTO luck_copan (emailid, subscription_start, subscription_type, visual_mode, signature_accent, compact_mode, glass_layers, push_alerts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [emailid, subscription_start, subscription_type, visual_mode, signature_accent, compact_mode ? 1 : 0, glass_layers ? 1 : 0, push_alerts ? 1 : 0]
    );
    return await findLuckUserByEmail(emailid);
}

async function updateUserSettings(userData) {
    const db = await getDb();
    const { emailid, subscription_type, visual_mode, signature_accent, compact_mode, glass_layers, push_alerts } = userData;
    await db.run(
        `UPDATE users SET subscription_type = ?, visual_mode = ?, signature_accent = ?, compact_mode = ?, glass_layers = ?, push_alerts = ? WHERE emailid = ?`,
        [subscription_type, visual_mode, signature_accent, compact_mode ? 1 : 0, glass_layers ? 1 : 0, push_alerts ? 1 : 0, emailid]
    );
    return true;
}

async function updateLuckUserSettings(userData) {
    const db = await getDb();
    const { emailid, subscription_type, visual_mode, signature_accent, compact_mode, glass_layers, push_alerts } = userData;
    await db.run(
        `UPDATE luck_copan SET subscription_type = ?, visual_mode = ?, signature_accent = ?, compact_mode = ?, glass_layers = ?, push_alerts = ? WHERE emailid = ?`,
        [subscription_type, visual_mode, signature_accent, compact_mode ? 1 : 0, glass_layers ? 1 : 0, push_alerts ? 1 : 0, emailid]
    );
    return true;
}

module.exports = { findUserByEmail, createUser, findLuckUserByEmail, createLuckUser, updateUserSettings, updateLuckUserSettings };
