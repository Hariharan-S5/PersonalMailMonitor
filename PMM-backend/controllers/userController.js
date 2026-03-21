const userModel = require('../models/userModel');

const getUserPermission = async (req, res) => {
    try {
        const { emailid } = req.body;
        
        // Return null data if no email or user not found to trigger plan selection
        if (!emailid) {
            return res.json({
                subscription_type: null,
                visual_mode: null,
                signature_accent: null,
                compact_mode: null,
                glass_layers: null,
                push_alerts: null,
                live_subscription_interval: null
            });
        }

        const user = await userModel.findUserByEmail(emailid);
        if (!user) {
            return res.json({
                subscription_type: null,
                visual_mode: null,
                signature_accent: null,
                compact_mode: null,
                glass_layers: null,
                push_alerts: null,
                live_subscription_interval: null
            });
        }

        const currentEpoch = Math.floor(Date.now() / 1000);
        const liveSubscriptionInterval = currentEpoch - user.subscription_start;

        res.json({
            subscription_type: user.subscription_type,
            visual_mode: user.visual_mode,
            signature_accent: user.signature_accent,
            compact_mode: !!user.compact_mode,
            glass_layers: !!user.glass_layers,
            push_alerts: !!user.push_alerts,
            live_subscription_interval: liveSubscriptionInterval.toString()
        });
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const createNewUser = async (req, res) => {
    try {
        const { emailid, subscription_type } = req.body;
        // Allowed empty email for simulation/initialization flow
        if (!emailid) {
            const subscription_start = Math.floor(Date.now() / 1000);
            return res.json({
                subscription_type: subscription_type || 'Basic',
                visual_mode: 'Light',
                signature_accent: 'SkyBlue',
                compact_mode: false,
                glass_layers: false,
                push_alerts: false,
                live_subscription_interval: subscription_start.toString()
            });
        }

        const existingUser = await userModel.findUserByEmail(emailid);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const subscription_start = Math.floor(Date.now() / 1000);
        await userModel.createUser({ 
            emailid, 
            subscription_start, 
            subscription_type: subscription_type || 'Basic' 
        });

        res.json({
            subscription_type: subscription_type || 'Basic',
            visual_mode: 'Light',
            signature_accent: 'SkyBlue',
            compact_mode: false,
            glass_layers: false,
            push_alerts: false,
            live_subscription_interval: subscription_start.toString()
        });
    } catch (error) {
        console.error('Error creating new user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const clearUsers = async (req, res) => {
    try {
        const { getDb } = require('../database/db');
        const db = await getDb();
        await db.run('DELETE FROM users');
        res.json({ message: 'All users deleted successfully.' });
    } catch (error) {
        console.error('Error clearing users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getUserPermission, createNewUser, clearUsers };
