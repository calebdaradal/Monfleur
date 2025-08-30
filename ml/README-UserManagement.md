# User Management System - Firestore Only

This user management system has been refactored to use **Firestore only**, removing all dependencies on Firebase Authentication and Cloud Functions.

## Key Changes Made

### 🔄 **Removed Components**
- Firebase Authentication (`getAuth`, `createUserWithEmailAndPassword`, etc.)
- Firebase Cloud Functions for user deletion
- Authentication state management
- Login/logout functionality

### ✅ **New Features**
- **Client-side UID generation** using `crypto.randomUUID()`
- **Direct Firestore operations** for all user management
- **Simplified admin access** via session storage
- **Admin setup page** for demo purposes

## File Structure

```
ml/
├── user-management.html     # Main user management interface
├── user-management.js       # Core user management logic (Firestore only)
├── login.html               # Login page for admin access
├── config/
│   └── firebase-config.js   # Firebase configuration (Firestore only)
└── README-UserManagement.md # This documentation
```

## How to Use

### 1. **Access the System**
- Open `login.html` in your browser
- Enter login credentials:
  - **Email:** Use your registered administrator account
  - **Password:** `admin123`
- Click "Sign In"

### 2. **User Operations**

#### **Create User**
- Email address (required)
- Password (required, minimum 6 characters)
- Display name (optional)
- Role (user/moderator/admin)

#### **Delete User**
- Click delete button next to any user
- Confirm deletion in modal
- Admin accounts cannot be deleted

#### **View Users**
- All users are loaded from Firestore
- Real-time updates when users are added/deleted
- Admin accounts are shown with special styling

## Technical Details

### **User Data Structure**
```javascript
{
  uid: "generated-uuid",           // Client-generated UUID
  email: "user@example.com",       // User email
  displayName: "John Doe",         // Display name
  role: "user",                    // user/moderator/admin
  createdAt: "2024-01-01T00:00:00Z", // ISO timestamp
  isActive: true                   // User status
}
```

### **Admin Accounts**
Two hardcoded admin accounts:
- Administrator accounts are managed through Firestore
- No hardcoded credentials - all users stored in database

### **Security Considerations**
⚠️ **Important**: This is a simplified demo system. For production use:

1. **Implement proper authentication**
2. **Add Firestore security rules**
3. **Validate user permissions server-side**
4. **Use secure password hashing**
5. **Add input validation and sanitization**

## Deployment

### **Static Hosting**
1. Upload all files to any web host
2. Ensure Firebase project is configured
3. Set up Firestore database
4. Configure Firestore rules (optional)

### **Firebase Hosting (Optional)**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy
firebase deploy --only hosting
```

## Firestore Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to users collection
    match /users/{document} {
      allow read, write: if true; // Adjust based on your security needs
    }
  }
}
```

## Browser Compatibility

- **Modern browsers** with ES6 module support
- **HTTPS required** for production (Firebase requirement)
- **Local development**: Use local server (not file:// protocol)

## Troubleshooting

### **Common Issues**
1. **"Module not found"** → Ensure you're using HTTPS or local server
2. **"Permission denied"** → Check Firestore rules
3. **"Admin access denied"** → Use login.html first
4. **"Firebase not initialized"** → Check firebase-config.js

### **Development Server**
```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

## Migration Notes

If migrating from Firebase Auth:
1. Export existing user data
2. Transform to new structure
3. Import to Firestore
4. Update client applications

---

**Note**: This system prioritizes simplicity over security. Implement proper authentication and authorization for production use.