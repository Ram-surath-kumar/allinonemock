
import fetch from 'node-fetch';

async function testLogin() {
    try {
        console.log('Testing login with invalid token...');
        const response = await fetch('http://localhost:3001/api/users', {
            headers: {
                'Authorization': 'Bearer invalid_token_123'
            }
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (err) {
        console.error('Error:', err);
    }
}

testLogin();
