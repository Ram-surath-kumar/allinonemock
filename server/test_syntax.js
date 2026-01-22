import fs from 'fs';

(async () => {
    try {
        console.log('Loading finance.js...');
        await import('./routes/finance.js');
        console.log('Finance loaded');

        console.log('Loading index.js...');
        await import('./index.js');
        console.log('Index loaded');
    } catch (e) {
        console.error(e);
        fs.writeFileSync('error_dump.txt', e.stack || e.toString());
    }
})();
