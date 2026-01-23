
import dotenv from 'dotenv';
import { resolve } from 'path';
import { secureDb } from './services/db.js';

dotenv.config({ path: resolve(process.cwd(), '.env') });

async function seedData() {
    try {
        console.log('Seeding Test Data...');
        const context = { user: { id: 'seed_script' } };

        // 1. Ensure Hostel
        const hostels = await secureDb.get('hostels', q => q.limit(1));
        let hostelId;
        if (!hostels.length) {
            console.log('Creating Hostel...');
            const h = await secureDb.create('hostels', { name: 'Test Hostel', type: 'Boys' }, context);
            hostelId = h.id;
        } else {
            hostelId = hostels[0].id;
        }

        // 2. Ensure Room
        const rooms = await secureDb.get('hostel_rooms', q => q.eq('hostel_id', hostelId).limit(1));
        if (!rooms.length) {
            console.log('Creating Hostel Room...');
            await secureDb.create('hostel_rooms', {
                hostel_id: hostelId,
                room_number: '101',
                capacity: 4
            }, context);
        }

        // 3. Ensure Book
        const books = await secureDb.get('books', q => q.limit(1));
        let bookId;
        if (!books.length) {
            console.log('Creating Book...');
            const b = await secureDb.create('books', { title: 'Test Book', author: 'Tester' }, context);
            bookId = b.id;
        } else {
            bookId = books[0].id;
        }

        // 4. Ensure Copy
        const copies = await secureDb.get('book_copies', q => q.eq('book_id', bookId).limit(1));
        if (!copies.length) {
            console.log('Creating Book Copy...');
            await secureDb.create('book_copies', { book_id: bookId, status: 'available' }, context);
        }

        console.log('✅ Seeding Complete.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding Failed:', e);
        process.exit(1);
    }
}

seedData();
