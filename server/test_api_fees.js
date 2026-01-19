
async function testApi() {
    const studentId = '3f077618-ee5b-48fe-82c0-5f74aa935596'; // Vinay's ID
    const url = `http://localhost:3001/api/finance/student/${studentId}/fees`;

    console.log(`Fetching from: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                // Assuming we need some auth headers? 
                // The route uses 'authenticateUser' middleware?
                // If so, we might get 401/403 without a token.
                // let's try without first, if it fails, I'll Mock the auth middleware or generate a token.
            }
        });

        console.log(`Status: ${res.status} ${res.statusText}`);

        if (res.ok) {
            const json = await res.json();
            console.log('Response Data:', JSON.stringify(json, null, 2));
        } else {
            const text = await res.text();
            console.log('Error Body:', text);
        }

    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

testApi();
