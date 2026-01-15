
import { exec } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Configuration
const BACKUP_DIR = './backups';
const RETENTION_DAYS = 30; // Local retention
const DB_URL = process.env.DATABASE_URL; // Direct connection string required for pg_dump

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);
const encryptedFile = `${backupFile}.enc`;

// 1. Dump Database
const dumpCommand = `pg_dump "${DB_URL}" -f "${backupFile}"`;

console.log(`[Backup] Starting backup...`);

// Encryption Key for Backup (Separate from App Key recommended, but using env for demo)
const BACKUP_KEY = process.env.BACKUP_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || 'fallback-key';

exec(dumpCommand, (error, stdout, stderr) => {
    if (error) {
        console.error(`[Backup] Failed: ${error.message}`);
        // Log failure to Audit Log via API if possible
        process.exit(1);
    }

    console.log(`[Backup] Database dumped to ${backupFile}`);

    // 2. Encrypt Backup
    // Using openssl for file encryption
    exec(`openssl enc -aes-256-cbc -salt -in "${backupFile}" -out "${encryptedFile}" -k "${BACKUP_KEY}"`, (encError) => {
        if (encError) {
            console.error(`[Backup] Encryption Failed: ${encError.message}`);
            process.exit(1);
        }

        console.log(`[Backup] Encrypted to ${encryptedFile}`);

        // 3. Remove Unencrypted File
        fs.unlinkSync(backupFile);
        console.log(`[Backup] Cleaned up plaintext file.`);

        // 4. (Optional) Upload to Off-site Storage (AWS S3 / GCS)
        // placeholder for upload logic
        console.log(`[Backup] Ready for off-site upload.`);

        // 5. Cleanup Old Backups
        // cleanupLogic(BACKUP_DIR, RETENTION_DAYS);
    });
});
