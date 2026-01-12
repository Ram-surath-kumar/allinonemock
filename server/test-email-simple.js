import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv to read from the same directory as this script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Testing Email Configuration...');
console.log('---------------------------');
console.log('User:', process.env.GMAIL_USER);
// Mask password for security in logs
const rawPass = process.env.GMAIL_APP_PASSWORD || '';
console.log('Password exists:', !!rawPass);
console.log('Password length:', rawPass.length);

// Strip spaces from password (the fix)
const cleanPass = rawPass.replace(/\s+/g, '');
console.log('Cleaned Password length:', cleanPass.length);

async function testEmail() {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: cleanPass, // Using cleaned password
            },
        });

        console.log('Attempting to verify connection...');
        await transporter.verify();
        console.log('✅ Connection verified successfully!');

        console.log('Attempting to send test email...');
        const info = await transporter.sendMail({
            from: `"${process.env.GMAIL_FROM_NAME || 'Test'}" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER, // Send to self
            subject: 'Test Email from SchoolSphere Debugger',
            text: 'If you receive this, the email configuration is working correctly with the space-stripped password.',
            html: '<b>If you receive this, the email configuration is working correctly with the space-stripped password.</b>',
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);

    } catch (error) {
        console.error('❌ Error:', error);
        if (error.code === 'EAUTH') {
            console.error('Authentication failed. Please check your App Password.');
        }
    }
}

testEmail();
