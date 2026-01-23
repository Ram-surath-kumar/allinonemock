// import fetch from 'node-fetch'; // Using global fetch


const baseUrl = 'http://localhost:3001/api';

const payload = {
    vehicle_id: 'VEH-TEST-' + Date.now(),
    vehicle_type: 'Bus',
    registration_number: 'MH01TEST' + Date.now().toString().slice(-4),
    year_of_manufacture: 2026,
    engine_type: 'Diesel',
    owner_name: 'College',
    ownership_type: 'Owned',
    status: 'Active',

    // Simulating frontend state where user leaves these empty
    registration_date: null,
    renewal_date: null,
    expiry_date: null,
    // purchase_date: undefined -> Omitted
    // purchase_cost: undefined -> Omitted
    // monthly_lease_cost: undefined -> Omitted

    current_odometer_reading: 0,
    fuel_tank_capacity: null,
    seating_capacity: null,
    chassis_number: '',
    engine_number: '',
    color: '',
    make_model: ''
};

// console.log('Sending payload:', JSON.stringify(payload, null, 2));


try {
    const res = await fetch(`${baseUrl}/transport/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
} catch (error) {
    console.error('Fetch error:', error);
}
