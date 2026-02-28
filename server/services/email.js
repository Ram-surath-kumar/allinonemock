import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.GMAIL_USER, // Your Gmail address
      pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ''), // Gmail App Password (removes spaces)
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
    pool: true, // Use connection pooling
    maxConnections: 1,
    maxMessages: 3,
  });
};

/**
 * Generate a random 12-digit alphanumeric password
 */
export function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Send welcome email with credentials to college email
 */
export async function sendWelcomeEmail(collegeEmail, loopEmail, loopid, password, userName) {
  if (!collegeEmail) {
    throw new Error('College email is required');
  }

  // Debug/Dev Mode: If credentials aren't set, log to console instead of failing
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('---------------------------------------------------');
    console.log('⚠️  GMAIL CREDENTIALS MISSING - MOCKING EMAIL SEND  ⚠️');
    console.log('---------------------------------------------------');
    console.log(`To: ${collegeEmail}`);
    console.log(`Subject: Welcome to LoopVerse ERP - Your Account Credentials`);
    console.log(`Credentials:`);
    console.log(`  Loop Email: ${loopEmail}`);
    console.log(`  Password:   ${password}`);
    console.log('---------------------------------------------------');
    console.log('To send real emails, set GMAIL_USER and GMAIL_APP_PASSWORD in .env');

    return { success: true, messageId: 'mock-email-' + Date.now() };
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.GMAIL_FROM_NAME || 'LoopVerse ERP'}" <${process.env.GMAIL_USER}>`,
      to: collegeEmail,
      subject: 'Welcome to LoopVerse ERP - Your Account Credentials',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to LoopVerse ERP</title>
        </head>
        <body style="font-family: sans-serif;">
          <h1>Welcome to LoopVerse ERP, ${userName}!</h1>
          <p>Your account has been created.</p>
          <p><strong>Loop Email:</strong> ${loopEmail}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}">Login Here</a></p>
        </body>
        </html>
      `,
      text: `Hello ${userName},\n\nYour account is ready.\nLoop Email: ${loopEmail}\nPassword: ${password}\n\nLogin at: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`
    };

    // Verify connection before sending
    await transporter.verify();

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);

    // Provide more helpful error messages
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      throw new Error('Email server connection failed. Please check your internet connection and email configuration.');
    } else if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check GMAIL_USER and GMAIL_APP_PASSWORD in server .env file.');
    } else if (error.responseCode === 535) {
      throw new Error('Email authentication failed. Invalid Gmail App Password.');
    }

    throw error;
  }
}
