const axios = require('axios');

const BASE_URL = 'http://localhost:3000/pmm';

async function test() {
    try {
        console.log('--- Testing API Endpoints ---');

        // 1. Create a new user
        console.log('\n[1] Creating new user...');
        try {
            const createRes = await axios.post(`${BASE_URL}/newuser/post`, {
                emailid: 'test@pmm.com'
            });
            console.log('Success:', JSON.stringify(createRes.data, null, 2));
        } catch (err) {
            console.error('Failed to create user:', err.response ? err.response.data : err.message);
        }

        // 2. Get user permissions
        console.log('\n[2] Getting user permissions...');
        try {
            const getRes = await axios.post(`${BASE_URL}/getuser/permisson`, {
                emailid: 'test@pmm.com'
            });
            console.log('Success:', JSON.stringify(getRes.data, null, 2));
        } catch (err) {
            console.error('Failed to get permissions:', err.response ? err.response.data : err.message);
        }

        // 3. Try creating same user (Conflict)
        console.log('\n[3] Creating duplicate user (Expected Conflict)...');
        try {
            await axios.post(`${BASE_URL}/newuser/post`, {
                emailid: 'test@pmm.com'
            });
        } catch (err) {
            console.log('Success (Expected Error):', err.response ? err.response.data : err.message);
        }

        // 4. Get non-existent user (Not Found)
        console.log('\n[4] Getting non-existent user (Expected Not Found)...');
        try {
            await axios.post(`${BASE_URL}/getuser/permisson`, {
                emailid: 'unknown@pmm.com'
            });
        } catch (err) {
            console.log('Success (Expected Error):', err.response ? err.response.data : err.message);
        }

        console.log('\n--- Tests Completed ---');
    } catch (error) {
        console.error('Unexpected error during testing:', error);
    }
}

test();
