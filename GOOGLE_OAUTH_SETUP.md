# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for the repair notification system.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity and Access Management (IAM) API"

## Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Configure the OAuth consent screen if prompted:
   - Add your app name
   - Add authorized domains (localhost for development)
5. Set up authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
6. Click "Create"
7. Copy the Client ID and Client Secret

## Step 4: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Step 5: Update OAuth Consent Screen (for production)

1. Go to "APIs & Services" > "OAuth consent screen"
2. Fill in the required information:
   - App name
   - User support email
   - Developer contact information
3. Add scopes (email and profile are sufficient)
4. Add test users if in testing mode
5. Submit for verification if going to production

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Go to the sign-in page: `http://localhost:3000/auth/signin`
3. Click "เข้าสู่ระบบด้วย Google"
4. Complete the Google OAuth flow
5. Verify that the user is created in your database

## Important Notes

- The Google OAuth integration will automatically create a new user in your database if one doesn't exist
- Users who sign in with Google will have the default role of "USER"
- The system uses the user's Google email as the primary identifier
- Google profile images are stored in the user's `image` field

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Ensure the redirect URI in Google Console matches exactly: `http://localhost:3000/api/auth/callback/google`

2. **"access_denied" error**
   - Check that the OAuth consent screen is properly configured
   - Ensure the user's email is added to test users (if in testing mode)

3. **Database connection errors**
   - Verify that your DATABASE_URL is correctly set
   - Ensure the database is running and accessible

### Environment Variables Checklist

Make sure these environment variables are set:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DATABASE_URL`