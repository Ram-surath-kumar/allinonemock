
import { secureDb } from './services/db.js';
import fs from 'fs';

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('verify_transport_log.txt', typeof msg === 'string' ? msg + '\n' : JSON.stringify(msg, null, 2) + '\n');
};
fs.writeFileSync('verify_transport_log.txt', '');

async function runVerification() {
    log('--- Starting Transport V2 Data Verification ---');
    const context = { performed_by: '00000000-0000-0000-0000-000000000000' };

    try {
        log('1. Testing Table Access...');

        // 1. Vehicle
        const vehicle = await secureDb.create('transport_vehicles', {
            vehicle_number: `BUS-${Date.now()}`,
            vehicle_type: 'Bus',
            capacity: 50,
            driver_name: 'Test Driver',
            status: 'active'
        }, context);
        log(`   -> Created Vehicle: ${vehicle.vehicle_number} (${vehicle.id})`);

        // 2. Route
        const route = await secureDb.create('transport_routes', {
            route_name: 'Advanced Route 1',
            route_id: `RT-${Date.now()}`, // Unique constraint
            vehicle_id: vehicle.id,
            route_type: 'Morning',
            start_point: 'City',
            end_point: 'Campus',
            avg_cost_per_student: 800,
            status: 'active'
        }, context);
        log(`   -> Created Route: ${route.route_name}`);

        // 3. Stop
        const stop = await secureDb.create('transport_stops', {
            route_id: route.id,
            stop_name: 'Stop 1',
            stop_order: 1,
            arrival_time: '08:00',
            avg_boarding_count: 5 // V2 field
        }, context);
        log(`   -> Created Stop: ${stop.stop_name}`);

        // 4. Registration (Needs numeric student_id)
        // We'll just verify the table path exists.
        const regs = await secureDb.get('transport_registrations');
        log(`   -> Registrations table accessible (count: ${regs.length})`);

        log('\n✅ SUCCESS: Transport V2 tables are online.');

    } catch (e) {
        log(`\n❌ CRITICAL ERROR: ${e.message}`);
        console.error(e);
        process.exit(1);
    }

    process.exit(0);
}

runVerification();
