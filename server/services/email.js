import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Your Gmail address
      pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ''), // Gmail App Password (removes spaces)
    },

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
  try {
    if (!collegeEmail) {
      throw new Error('College email is required');
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env file');
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.GMAIL_FROM_NAME || 'LoopVerse ERP'}" <${process.env.GMAIL_USER}>`,
      to: collegeEmail,
      subject: 'Welcome to LoopVerse ERP - Your Account Credentials',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to LoopVerse ERP</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to LoopVerse ERP!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px;">Hello ${userName},</p>
            
            <p style="font-size: 16px;">Your account has been successfully created. Below are your login credentials:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #667eea;">Your Account Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 120px;">Loop Email:</td>
                  <td style="padding: 8px 0;"><strong style="color: #667eea;">${loopEmail}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Loop ID:</td>
                  <td style="padding: 8px 0;"><strong>${loopid}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Password:</td>
                  <td style="padding: 8px 0;"><strong style="color: #d32f2f; font-size: 18px; letter-spacing: 2px;">${password}</strong></td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; font-size: 14px;">
                <strong>⚠️ Important:</strong> Please save this password securely. For security reasons, we recommend changing your password after your first login.
              </p>
            </div>
            
            <p style="font-size: 16px;">You can now log in to LoopVerse ERP using your Loop Email and the password provided above.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Login to LoopVerse ERP
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you have any questions or need assistance, please contact your administrator.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to LoopVerse ERP!

Hello ${userName},

Your account has been successfully created. Below are your login credentials:

Loop Email: ${loopEmail}
Loop ID: ${loopid}
Password: ${password}

⚠️ Important: Please save this password securely. For security reasons, we recommend changing your password after your first login.

You can now log in to LoopVerse ERP using your Loop Email and the password provided above.

Login URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}

If you have any questions or need assistance, please contact your administrator.

This is an automated email. Please do not reply to this message.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
