/**
 * Authentication Service Module
 * Handles user authentication exclusively through Firestore
 * Follows SOLID principles for maintainability and extensibility
 */

import firebaseConfig from '../config/firebase-config.js';

/**
 * Authentication Service Class
 * Manages user authentication, session handling, and role-based access control
 * Uses only Firestore as the data source - no hardcoded credentials
 */
class AuthenticationService {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.currentUser = null;
        this.firestoreFunctions = null;
        
        console.log('🔐 Authentication Service initialized');
    }

    /**
     * Initialize Firebase Firestore connection
     * @returns {Promise<boolean>} Initialization success status
     */
    async initialize() {
        try {
            // Initialize Firebase config
            const configInitialized = await firebaseConfig.initialize();
            if (!configInitialized) {
                throw new Error('Firebase configuration failed');
            }

            // Import and initialize Firestore functions
            const { 
                getFirestore, 
                collection, 
                getDocs, 
                query, 
                where, 
                limit 
            } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            this.db = getFirestore(firebaseConfig.app);
            
            // Store Firestore functions for later use
            this.firestoreFunctions = {
                collection,
                getDocs,
                query,
                where,
                limit
            };

            // Restore session if available
            this.restoreSession();
            
            this.isInitialized = true;
            console.log('✅ Authentication Service initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Authentication Service initialization failed:', error);
            return false;
        }
    }

    /**
     * Authenticate user against Firestore database
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Authentication result
     */
    async authenticateUser(email, password) {
        try {
            if (!this.isInitialized) {
                throw new Error('Authentication service not initialized');
            }

            // Validate input parameters
            if (!email || !password) {
                return {
                    success: false,
                    error: 'Email and password are required',
                    code: 'MISSING_CREDENTIALS'
                };
            }

            // Query Firestore for user by email
            const user = await this.getUserByEmail(email);
            
            if (!user) {
                return {
                    success: false,
                    error: 'Invalid email or password',
                    code: 'INVALID_CREDENTIALS'
                };
            }

            // Check if account is active - return same error as invalid credentials for security
            if (!user.active) {
                return {
                    success: false,
                    error: 'Invalid email or password',
                    code: 'INVALID_CREDENTIALS'
                };
            }

            // Verify password
            const isPasswordValid = await this.verifyPassword(password, user.password);
            
            if (!isPasswordValid) {
                return {
                    success: false,
                    error: 'Invalid email or password',
                    code: 'INVALID_CREDENTIALS'
                };
            }

            // Create authenticated user object
            const authenticatedUser = {
                uid: user.uid,
                email: user.email,
                username: user.username,
                role: user.role,
                displayName: user.displayName,
                active: user.active,
                createdAt: user.createdAt,
                lastLogin: new Date().toISOString()
            };

            // Set current user and store in session storage
            this.setCurrentUser(authenticatedUser);

            console.log('✅ User authenticated successfully:', email);
            return {
                success: true,
                user: authenticatedUser,
                message: 'Authentication successful'
            };

        } catch (error) {
            console.error('❌ Authentication error:', error);
            return {
                success: false,
                error: 'Authentication failed. Please try again.',
                code: 'AUTH_ERROR'
            };
        }
    }

    /**
     * Get user by email from Firestore
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User object or null if not found
     */
    async getUserByEmail(email) {
        try {
            if (!this.isInitialized) {
                throw new Error('Authentication service not initialized');
            }

            const { collection, query, where, getDocs, limit } = this.firestoreFunctions;
            
            // Query users collection for matching email
            const usersRef = collection(this.db, 'users');
            const q = query(
                usersRef, 
                where('email', '==', email.toLowerCase()),
                limit(1)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                console.log('🔍 User not found:', email);
                return null;
            }

            // Get the first (and should be only) matching user
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            
            return {
                uid: userDoc.id,
                ...userData
            };

        } catch (error) {
            console.error('❌ Error fetching user by email:', error);
            throw error;
        }
    }

    /**
     * Verify password using SHA-256 hashing
     * @param {string} password - Plain text password
     * @param {string} storedHash - Stored password hash
     * @returns {Promise<boolean>} Password verification result
     */
    async verifyPassword(password, storedHash) {
        try {
            // Hash the provided password
            const hashedPassword = await this.hashPassword(password);
            
            // Compare with stored hash
            return hashedPassword === storedHash;
        } catch (error) {
            console.error('❌ Password verification error:', error);
            return false;
        }
    }

    /**
     * Hash password using SHA-256
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    async hashPassword(password) {
        try {
            // Convert password to Uint8Array
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            
            // Hash using SHA-256
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            
            // Convert to hex string
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return hashHex;
        } catch (error) {
            console.error('❌ Password hashing error:', error);
            throw error;
        }
    }

    /**
     * Set current authenticated user and manage session
     * @param {Object} user - Authenticated user object
     * @returns {boolean} Success status
     */
    setCurrentUser(user) {
        try {
            if (!user || !user.email || !user.role) {
                console.error('❌ Invalid user object provided');
                return false;
            }

            this.currentUser = user;
            
            // Store in session storage for persistence
            sessionStorage.setItem('adminEmail', user.email);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            
            // Store username separately for easy access
            if (user.username) {
                sessionStorage.setItem('username', user.username);
            }
            
            console.log(`✅ Current user set: ${user.email} (${user.role})`);
            return true;
        } catch (error) {
            console.error('❌ Error setting current user:', error);
            return false;
        }
    }

    /**
     * Get current authenticated user
     * @returns {Object|null} Current user or null if not authenticated
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Check if current user is an administrator
     * @returns {boolean} Administrator status
     */
    isAdministrator() {
        return this.currentUser && (this.currentUser.role === 'administrator' || this.currentUser.role === 'admin');
    }

    /**
     * Check if current user is a moderator
     * @returns {boolean} Moderator status
     */
    isModerator() {
        return this.currentUser && this.currentUser.role === 'moderator';
    }

    /**
     * Get current user's role
     * @returns {string|null} User role or null if not authenticated
     */
    getCurrentUserRole() {
        return this.currentUser ? this.currentUser.role : null;
    }

    /**
     * Check if user has admin privileges (administrator or moderator)
     * @returns {boolean} Admin privileges status
     */
    hasAdminPrivileges() {
        return this.isAdministrator() || this.isModerator();
    }

    /**
     * Restore user session from storage
     * @returns {boolean} Session restoration success
     */
    restoreSession() {
        try {
            const adminEmail = sessionStorage.getItem('adminEmail');
            const currentUserData = sessionStorage.getItem('currentUser');
            const username = sessionStorage.getItem('username');
            
            // Try to restore from currentUser data first
            if (currentUserData) {
                try {
                    const user = JSON.parse(currentUserData);
                    this.currentUser = user;
                    console.log('✅ Session restored from currentUser for:', user.email || user.username);
                    return true;
                } catch (parseError) {
                    console.warn('⚠️ Failed to parse currentUser data:', parseError);
                }
            }
            
            // Fallback to adminEmail if currentUser is not available
            if (adminEmail) {
                this.currentUser = {
                    email: adminEmail,
                    username: username || adminEmail.split('@')[0],
                    role: 'moderator', // Default role for legacy sessions
                    uid: 'legacy-' + Date.now()
                };
                console.log('✅ Session restored from adminEmail for:', adminEmail);
                return true;
            }
            
            console.log('ℹ️ No session to restore');
            return false;
        } catch (error) {
            console.error('❌ Error restoring session:', error);
            return false;
        }
    }

    /**
     * Clear user session and logout
     */
    logout() {
        try {
            this.currentUser = null;
            sessionStorage.removeItem('adminEmail');
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('username');
            console.log('✅ User logged out successfully');
        } catch (error) {
            console.error('❌ Error during logout:', error);
        }
    }

    /**
     * Validate user access for specific pages
     * @param {string} requiredRole - Required role for access ('administrator', 'moderator', or 'any')
     * @returns {Object} Access validation result
     */
    validateAccess(requiredRole = 'any') {
        // Check if user is authenticated
        if (!this.isAuthenticated()) {
            return {
                hasAccess: false,
                redirectTo: '../login.html',
                reason: 'Not authenticated'
            };
        }

        const userRole = this.getCurrentUserRole();
        
        // Check role-specific access
        switch (requiredRole) {
            case 'administrator':
                if (!this.isAdministrator()) {
                    return {
                        hasAccess: false,
                        redirectTo: this.isModerator() ? 'profile-settings.html' : '../login.html',
                        reason: 'Insufficient privileges - Administrator access required'
                    };
                }
                break;
                
            case 'moderator':
                if (!this.isModerator()) {
                    return {
                        hasAccess: false,
                        redirectTo: this.isAdministrator() ? 'user-management.html' : '../login.html',
                        reason: 'Insufficient privileges - Moderator access required'
                    };
                }
                break;
                
            case 'any':
                if (!this.hasAdminPrivileges()) {
                    return {
                        hasAccess: false,
                        redirectTo: '../login.html',
                        reason: 'Admin privileges required'
                    };
                }
                break;
        }

        return {
            hasAccess: true,
            user: this.currentUser,
            role: userRole
        };
    }

    /**
     * Get user-friendly error messages
     * @param {string} errorCode - Error code
     * @returns {string} User-friendly error message
     */
    getErrorMessage(errorCode) {
        const errorMessages = {
            'MISSING_CREDENTIALS': 'Please enter both email and password.',
            'INVALID_CREDENTIALS': 'Invalid email or password.',
            'ACCOUNT_INACTIVE': 'Account is inactive. Please contact an administrator.',
            'AUTH_ERROR': 'Authentication failed. Please try again.',
            'SERVICE_UNAVAILABLE': 'Authentication service is temporarily unavailable.',
            'NETWORK_ERROR': 'Network error. Please check your connection.'
        };

        return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
    }
}

export default AuthenticationService;