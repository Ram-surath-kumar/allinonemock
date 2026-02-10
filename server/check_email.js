import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function verifyEmailConfig() {
    console.log('--- Testing Email Configuration ---');
    console.log(`User: ${process.env.GMAIL_USER}`);
    console.log(`Pass: ${process.env.GMAIL_APP_PASSWORD ? '******' : 'MISSING'}`);

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.error('❌ Missing email credentials in .env');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP connection established successfully.');

        const info = await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER, // Send to self for testing
            subject: 'Test Email from Debug Script',
            text: 'If you receive this, email sending is working.',
        });
        console.log('✅ Test email sent:', info.messageId);

    } catch (error) {
        console.error('❌ Email verification failed:', error);
    }
}

verifyEmailConfig();
