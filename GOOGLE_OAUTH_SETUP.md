# Google OAuth Configuration

This document explains how to configure Google OAuth for the application.

## Setup Steps

1. **Google Console Configuration**
   - Authorized JavaScript origins have been configured for:
     - `http://localhost:5004`
     - `http://localhost:3000`
   
   - Authorized redirect URI:
     - `http://localhost:5004/api/auth/google/callback`

2. **Environment Variables**
   
   Update the following variables in your `backend/.env` file:
   ```
   GOOGLE_CLIENT_ID=your-actual-google-client-id
   GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:5004/api/auth/google/callback
   ```

3. **Frontend Configuration**
   
   The frontend is configured to communicate with the backend at `http://localhost:5004`

## Important Notes

- Replace the placeholder values with your actual Google OAuth credentials
- The .env files are gitignored for security and should never be committed to the repository
- Make sure your Google Console project has the correct authorized origins and redirect URIs configured
- The callback URL must match exactly what's configured in Google Console

## Testing

To test the OAuth flow:
1. Start the backend server (should run on port 5004)
2. Start the frontend (should run on port 3000 or 5173)
3. Navigate to the login page and click "Sign in with Google"
4. You should be redirected to Google for authentication and then back to your app
