# Firebase Cloud Functions Deployment Guide

This guide explains how to deploy the Firebase Cloud Functions for complete user management, including deletion from Firebase Authentication.

## Prerequisites

1. **Firebase CLI**: Install the Firebase CLI globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project**: Ensure your Firebase project is properly configured

3. **Node.js**: Ensure you have Node.js 18 or higher installed

## Setup Instructions

### 1. Initialize Firebase Functions (if not already done)

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project directory
firebase init
```

When prompted:
- Select "Functions" and "Firestore" (and "Hosting" if needed)
- Choose your existing Firebase project
- Select JavaScript for Functions
- Choose to install dependencies

### 2. Install Function Dependencies

```bash
cd functions
npm install
```

### 3. Deploy the Functions

```bash
# Deploy only functions
firebase deploy --only functions

# Or deploy everything (functions, firestore rules, hosting)
firebase deploy
```

### 4. Set up Firebase Admin SDK (Important!)

The Cloud Function requires Firebase Admin SDK to delete users from Authentication. Make sure your Firebase project has the necessary permissions:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key (this is automatically handled in Cloud Functions environment)
3. The function will use the default service account when deployed

## Function Details

### `deleteUser` Cloud Function

**Purpose**: Deletes users from both Firebase Authentication and Firestore

**Security**: 
- Requires authentication
- Checks for admin privileges (hardcoded admins or Firestore admin role)
- Prevents deletion of hardcoded admin accounts

**Usage**: Called automatically by the client-side user management system

## Testing

### Local Testing with Emulators

```bash
# Start Firebase emulators
firebase emulators:start

# Test functions locally
firebase functions:shell
```

### Production Testing

After deployment:
1. Go to your user management page
2. Try deleting a test user
3. Check Firebase Console to verify the user is deleted from both Authentication and Firestore

## Troubleshooting

### Common Issues

1. **Function not found error**:
   - Ensure functions are properly deployed
   - Check function names match in `index.js`
   - Verify Firebase project configuration

2. **Permission denied**:
   - Ensure the calling user has admin privileges
   - Check Firebase Security Rules
   - Verify service account permissions

3. **Authentication errors**:
   - Ensure user is properly authenticated before calling the function
   - Check Firebase Auth configuration

### Fallback Behavior

If the Cloud Function is not available, the system will:
1. Show a warning about the Cloud Function not being found
2. Fall back to Firestore-only deletion
3. Display a message indicating the user still exists in Authentication

## Security Considerations

1. **Admin Verification**: The function verifies admin privileges before allowing deletion
2. **Hardcoded Admin Protection**: Prevents deletion of system admin accounts
3. **Authentication Required**: Only authenticated users can call the function
4. **Server-side Execution**: User deletion from Authentication happens server-side for security

## File Structure

```
functions/
├── index.js          # Main entry point
├── deleteUser.js     # User deletion Cloud Function
├── package.json      # Function dependencies
└── node_modules/     # Installed dependencies (after npm install)
```

## Environment Variables

No additional environment variables are required. The function uses:
- Firebase Admin SDK (automatically configured in Cloud Functions)
- Default service account credentials
- Firestore database connection

## Monitoring

Monitor function execution in:
- Firebase Console → Functions → Logs
- Google Cloud Console → Cloud Functions → Logs

## Cost Considerations

- Cloud Functions have a free tier with generous limits
- Each user deletion counts as one function invocation
- Firestore operations (read/write/delete) are billed separately
- Authentication operations are generally free

---

**Note**: This implementation provides a complete solution for user management with proper security measures. The fallback mechanism ensures the system continues to work even if Cloud Functions are not deployed, though with limited functionality.