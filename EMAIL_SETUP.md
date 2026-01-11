# Email Setup Guide

This guide explains how to set up Gmail to send welcome emails to users when they are created.

## Prerequisites

- A Gmail account
- Access to Gmail App Passwords (2-factor authentication must be enabled)

## Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security**
3. Under **Signing in to Google**, enable **2-Step Verification**
4. Follow the prompts to set it up

## Step 2: Generate App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Under **Signing in to Google**, find **App passwords**
4. Click on **App passwords**
5. Select **Mail** as the app
6. Select **Other (Custom name)** as the device
7. Enter "SchoolSphere" as the name
8. Click **Generate**
9. **Copy the 16-character password** (you'll need this for the `.env` file)

## Step 3: Configure Environment Variables

Add the following to your `server/.env` file:

```env
# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
GMAIL_FROM_NAME=SchoolSphere Admin

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:8080
```

**Important Notes:**
- Use your full Gmail address for `GMAIL_USER`
- Use the 16-character App Password (not your regular Gmail password)
- The App Password has no spaces - it's a single 16-character string
- For production, update `FRONTEND_URL` to your production domain

## Step 4: Install Dependencies

Make sure nodemailer is installed:

```bash
cd server
npm install nodemailer
```

## Step 5: Test the Setup

1. Create a new user in the system
2. Enter a college email address in the "College Email" field
3. After the user is created, check the college email inbox for the welcome email

## Troubleshooting

### Error: "Invalid login"
- Make sure you're using the App Password, not your regular Gmail password
- Verify 2-factor authentication is enabled
- Regenerate the App Password if needed

### Error: "Less secure app access"
- App Passwords replace "less secure app access"
- Make sure you're using an App Password, not enabling less secure apps

### Email not sending
- Check server logs for error messages
- Verify all environment variables are set correctly
- Test the email service directly using the email service file

### Email goes to spam
- This is normal for automated emails
- Consider setting up SPF/DKIM records for your domain (advanced)

## Security Best Practices

1. **Never commit `.env` file to git** - it's already in `.gitignore`
2. **Use App Passwords** - never use your main Gmail password
3. **Rotate App Passwords** periodically
4. **Use environment-specific credentials** for production

## Production Setup

For production deployments (Vercel, etc.):

1. Add the environment variables in your hosting platform's dashboard
2. Update `FRONTEND_URL` to your production domain
3. Consider using a dedicated email service (SendGrid, Mailgun, etc.) for better deliverability
