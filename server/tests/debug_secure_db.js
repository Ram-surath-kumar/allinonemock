
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

const context = {
    performed_by: 'test-admin',
    user_role: 'admin',
    ip_address: '127.0.0.1',
    user_agent: 'Test Script',
    user: { id: '00000000-0000-0000-0000-000000000000', email: 'test@admin.com' }
};

async function runTest() {
    console.log('--- Starting SecureDb Debug Test (Dynamic) ---');

    try {
        // Dynamic import to ensure Env is loaded
        const { secureDb } = await import('../services/db.js');

        // Test 1: Simple SecureDb Create (Audited)
        console.log('1. Testing secureDb.create (Audited)...');
        // We will create a fee head.
        const { data: head, error: headError } = await secureDb.create('fee_heads', {
            name: `Debug Secure Head ${Date.now()}`,
            category: 'Academic',
            is_active: true
        }, context);

        if (headError) {
            console.error('Create Failed:', headError);
        } else {
            console.log('Create Success:', head?.id);
        }
    } catch (err) {
        console.error('Test Threw:', err);
    } finally {
        console.log('--- Finished ---');
    }
}

runTest();
