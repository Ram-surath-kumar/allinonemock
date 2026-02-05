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
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Welcome to LoopVerse ERP</title>
          <style>
            /* Reset styles for email clients */
            body, table, td, p, a, li, blockquote {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            table, td {
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
            img {
              -ms-interpolation-mode: bicubic;
              border: 0;
              outline: none;
              text-decoration: none;
            }
            /* Mobile responsive */
            @media only screen and (max-width: 600px) {
              .container {
                width: 100% !important;
                padding: 10px !important;
              }
              .content {
                padding: 20px !important;
              }
              .credential-box {
                padding: 15px !important;
              }
              .credential-item {
                flex-direction: column !important;
                align-items: flex-start !important;
              }
              .credential-label {
                margin-bottom: 8px !important;
                width: 100% !important;
              }
              .credential-value {
                width: 100% !important;
              }
              .copy-button {
                width: 100% !important;
                margin-top: 8px !important;
              }
              .login-button {
                width: 100% !important;
                padding: 14px 20px !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <!-- Main Container -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa; padding: 20px 0;">
            <tr>
              <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header with Gradient -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Welcome to LoopVerse ERP!</h1>
                      <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 400;">Your account is ready</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td class="content" style="padding: 40px 30px;">
                      <!-- Greeting -->
                      <p style="margin: 0 0 20px 0; font-size: 18px; color: #1a202c; font-weight: 500;">Hello ${userName},</p>
                      
                      <p style="margin: 0 0 30px 0; font-size: 16px; color: #4a5568; line-height: 1.6;">Your account has been successfully created. Below are your login credentials:</p>
                      
                      <!-- Credentials Box -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="credential-box" style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 10px; padding: 25px; margin: 0 0 25px 0; border: 1px solid #e2e8f0;">
                        <tr>
                          <td>
                            <h3 style="margin: 0 0 20px 0; color: #667eea; font-size: 18px; font-weight: 600;">Your Account Details</h3>
                            
                            <!-- Loop Email -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 18px;">
                              <tr>
                                <td>
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="padding-bottom: 6px;">
                                        <span style="font-size: 13px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Loop Email</span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <div style="background: #ffffff; border: 2px solid #cbd5e0; border-radius: 8px; padding: 14px 16px; position: relative;">
                                          <span style="font-size: 15px; color: #667eea; font-weight: 600; font-family: 'Courier New', monospace; word-break: break-all; user-select: all; -webkit-user-select: all; display: block;">${loopEmail}</span>
                                          <div style="position: absolute; top: 8px; right: 8px;">
                                            <span style="background: #667eea; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Select to Copy</span>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Loop ID -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 18px;">
                              <tr>
                                <td>
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="padding-bottom: 6px;">
                                        <span style="font-size: 13px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Loop ID</span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <div style="background: #ffffff; border: 2px solid #cbd5e0; border-radius: 8px; padding: 14px 16px; position: relative;">
                                          <span style="font-size: 15px; color: #2d3748; font-weight: 600; font-family: 'Courier New', monospace; user-select: all; -webkit-user-select: all; display: block;">${loopid}</span>
                                          <div style="position: absolute; top: 8px; right: 8px;">
                                            <span style="background: #667eea; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Select to Copy</span>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Password -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td>
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="padding-bottom: 6px;">
                                        <span style="font-size: 13px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Password</span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <div style="background: #ffffff; border: 2px solid #e53e3e; border-radius: 8px; padding: 14px 16px; position: relative;">
                                          <span style="font-size: 17px; color: #e53e3e; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px; user-select: all; -webkit-user-select: all; display: block;">${password}</span>
                                          <div style="position: absolute; top: 8px; right: 8px;">
                                            <span style="background: #e53e3e; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Select to Copy</span>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Copy Instructions -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 20px;">
                              <tr>
                                <td style="padding: 12px; background: #edf2f7; border-radius: 8px; text-align: center;">
                                  <p style="margin: 0; font-size: 12px; color: #4a5568; line-height: 1.5;">
                                    <strong>💡 Tip:</strong> Triple-click any credential above to select and copy it easily
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Security Notice -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fff5e6; border-left: 4px solid #ffa500; border-radius: 8px; padding: 18px 20px; margin: 0 0 30px 0;">
                        <tr>
                          <td>
                            <p style="margin: 0; font-size: 14px; color: #744210; line-height: 1.6;">
                              <strong style="font-size: 16px;">⚠️ Important Security Notice:</strong><br>
                              Please save this password securely. For security reasons, we strongly recommend changing your password after your first login.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Login Instructions -->
                      <p style="margin: 0 0 25px 0; font-size: 16px; color: #4a5568; line-height: 1.6;">You can now log in to LoopVerse ERP using your Loop Email and the password provided above.</p>
                      
                      <!-- Login Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding: 10px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/login" class="login-button" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 10px; display: inline-block; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">🚀 Login to LoopVerse ERP</a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Help Text -->
                      <p style="margin: 30px 0 0 0; font-size: 14px; color: #718096; line-height: 1.6; text-align: center;">
                        If you have any questions or need assistance, please contact your administrator.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f7fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; font-size: 12px; color: #a0aec0; line-height: 1.5;">
                        This is an automated email. Please do not reply to this message.<br>
                        <span style="color: #cbd5e0;">© ${new Date().getFullYear()} LoopVerse ERP. All rights reserved.</span>
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
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
