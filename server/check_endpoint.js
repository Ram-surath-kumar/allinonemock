
import http from 'http';

function check() {
    console.log('Checking endpoint...');
    const req = http.get('http://localhost:3001/api/finance/assignments?type=Hostel', (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log('BODY HEAD:', data.substring(0, 200));
        });
    });

    req.on('error', (e) => {
        console.error('ERROR:', e.message);
    });
}

check();
