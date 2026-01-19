
import { secureDb } from './services/db.js';

async function testCreateFeeHead() {
    try {
        console.log("Starting Fee Head Creation Test...");
        const context = {
            user: { id: 'test-user-id', email: 'test@example.com' },
            ip: '127.0.0.1',
            reason: 'Automated Test'
        };

        const head = {
            name: `Test Head ${Date.now()}`,
            type: 'tuition',
            is_refundable: false
        };

        console.log("Attempting to create:", head);
        const result = await secureDb.create('fee_heads', head, context);
        console.log("Creation Result:", result);
        console.log("SUCCESS: Fee Head Created");
    } catch (error) {
        console.error("FAILURE: Fee Head Creation Failed:", error);
    }
}

testCreateFeeHead();
