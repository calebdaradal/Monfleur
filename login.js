/**
 * Login Authentication System
 * Handles user authentication for User Management System
 * Follows SOLID principles and maintainable code structure
 * Integrated with Firestore User Management System
 */

// Import Firebase configuration
import firebaseConfig from './ml/config/firebase-config.js';

/**
 * Authentication Manager Class
 * Handles all authentication operations using Firestore
 */
class AuthenticationManager {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.db = null;
        this.firestoreFunctions = null;
        console.log('🔧 DEBUG: AuthenticationManager constructor - Firestore integration enabled');
    }

    /**
     * Get user by email from Firestore
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User data or null
     */
    async getUserByEmail(email) {
        try {
            if (!this.isInitialized) {
                console.error('❌ DEBUG: System not initialized');
                return null;
            }

            console.log('🔍 DEBUG: Searching for user with email:', email);
            const usersRef = this.firestoreFunctions.collection(this.db, 'users');
            const q = this.firestoreFunctions.query(usersRef, this.firestoreFunctions.where('email', '==', email));
            const querySnapshot = await this.firestoreFunctions.getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                console.log('✅ DEBUG: User found in Firestore:', userData.email);
                return {
                    id: userDoc.id,
                    uid: userData.uid || userDoc.id,
                    ...userData
                };
            } else {
                console.log('❌ DEBUG: User not found in Firestore');
                return null;
            }
        } catch (error) {
            console.error('💥 DEBUG: Error getting user by email:', error);
            return null;
        }
    }

    /**
     * Get user by username from Firestore
     * @param {string} username - Username to search for
     * @returns {Promise<Object|null>} User object or null if not found
     */
    async getUserByUsername(username) {
        try {
            if (!this.isInitialized) {
                console.error('❌ DEBUG: System not initialized');
                return null;
            }

            console.log('🔍 DEBUG: Searching for user with username:', username);
            const usersRef = this.firestoreFunctions.collection(this.db, 'users');
            const q = this.firestoreFunctions.query(usersRef, this.firestoreFunctions.where('username', '==', username));
            const querySnapshot = await this.firestoreFunctions.getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                console.log('✅ DEBUG: User found in Firestore:', userData.username);
                return {
                    id: userDoc.id,
                    uid: userData.uid || userDoc.id,
                    ...userData
                };
            } else {
                console.log('❌ DEBUG: User not found in Firestore');
                return null;
            }
        } catch (error) {
            console.error('💥 DEBUG: Error getting user by username:', error);
            return null;
        }
    }

    /**
     * Hash password using multiple methods for compatibility
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    async hashPassword(password) {
        try {
            // Convert string to Uint8Array
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            
            // Hash using SHA-256
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            
            // Convert to hex string
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return hashHex;
        } catch (error) {
            console.error('Password hashing failed:', error);
            // Fallback to base64 encoding
            return btoa(password);
        }
    }

    /**
     * Verify password against stored hash
     * @param {string} password - Plain text password
     * @param {string} storedHash - Stored password hash
     * @returns {Promise<boolean>} Verification result
     */
    async verifyPassword(password, storedHash) {
        try {
            console.log('🔑 DEBUG: Verifying password...');
            console.log('🔑 DEBUG: Stored hash format:', storedHash);
            
            // Method 1: SHA-256 hash comparison with prefix format (sha256:hash)
            if (storedHash.startsWith('sha256:')) {
                const hashOnly = storedHash.substring(7); // Remove 'sha256:' prefix
                const sha256Hash = await this.hashPassword(password);
                console.log('🔑 DEBUG: Generated hash:', sha256Hash);
                console.log('🔑 DEBUG: Expected hash:', hashOnly);
                if (sha256Hash === hashOnly) {
                    console.log('✅ DEBUG: SHA-256 prefixed hash match');
                    return true;
                }
            }
            
            // Method 2: Direct SHA-256 hash comparison (legacy format)
            const sha256Hash = await this.hashPassword(password);
            if (sha256Hash === storedHash) {
                console.log('✅ DEBUG: SHA-256 hash match');
                return true;
            }
            
            // Method 3: Base64 comparison (legacy support)
            const base64Hash = btoa(password);
            if (base64Hash === storedHash) {
                console.log('✅ DEBUG: Base64 hash match');
                return true;
            }
            
            // Method 4: Direct comparison (for very old entries)
            if (password === storedHash) {
                console.log('✅ DEBUG: Direct password match (legacy)');
                return true;
            }
            
            console.log('❌ DEBUG: No password match found');
            return false;
        } catch (error) {
            console.error('💥 DEBUG: Password verification error:', error);
            return false;
        }
    }

    /**
     * Initialize Authentication System with Firestore
     * @returns {Promise<boolean>} Initialization success status
     */
    async initialize() {
        try {
            console.log('🔧 DEBUG: Initializing Firebase configuration...');
            // Initialize Firebase config
            const configInitialized = await firebaseConfig.initialize();
            if (!configInitialized) {
                throw new Error('Firebase configuration failed');
            }

            console.log('🔧 DEBUG: Initializing Firestore...');
            // Import and initialize Firestore
            const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            this.db = getFirestore(firebaseConfig.app);
            
            // Store Firestore functions for later use
            this.firestoreFunctions = {
                collection,
                addDoc,
                getDocs,
                deleteDoc,
                doc,
                updateDoc,
                query,
                orderBy,
                where
            };

            this.isInitialized = true;
            console.log('🔧 DEBUG: Authentication system initialized successfully with Firestore');
            return true;
        } catch (error) {
            console.error('❌ DEBUG: Authentication initialization failed:', error);
            return false;
        }
    }

    /**
     * Sign in user with email and password using Firestore
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Authentication result
     */
    /**
     * Sign in with email or username and password
     * @param {string} emailOrUsername - Email address or username
     * @param {string} password - User password
     * @returns {Promise<Object>} Authentication result
     */
    async signInWithEmailOrUsername(emailOrUsername, password) {
        console.log('🔐 DEBUG: Starting authentication process');
        console.log('📧 DEBUG: Email/Username provided:', emailOrUsername);
        console.log('🔑 DEBUG: Password provided:', password ? '[PASSWORD PROVIDED]' : '[NO PASSWORD]');
        
        if (!this.isInitialized) {
            console.error('❌ DEBUG: Authentication Manager not initialized');
            throw new Error('Authentication Manager not initialized');
        }

        try {
            console.log('🔧 DEBUG: Authenticating user against Firestore...');
            
            // Determine if input is email or username and get user from Firestore
            let user = null;
            const isEmail = this.isValidEmail(emailOrUsername);
            
            if (isEmail) {
                console.log('🔧 DEBUG: Input appears to be email, searching by email...');
                user = await this.getUserByEmail(emailOrUsername);
            } else {
                console.log('🔧 DEBUG: Input appears to be username, searching by username...');
                user = await this.getUserByUsername(emailOrUsername);
            }
            
            if (!user) {
                console.log('❌ DEBUG: User not found in Firestore');
                return {
                    success: false,
                    error: 'Invalid email/username or password',
                    code: 'auth/invalid-credentials'
                };
            }
            
            console.log('🔧 DEBUG: User found, verifying password...');
            
            // Verify password
            const passwordValid = await this.verifyPassword(password, user.password);
            if (!passwordValid) {
                console.log('❌ DEBUG: Password verification failed');
                return {
                    success: false,
                    error: 'Invalid email or password',
                    code: 'auth/invalid-credentials'
                };
            }
            
            // Check if account is active
            if (user.status && user.status !== 'active') {
                console.log('❌ DEBUG: Account is not active, status:', user.status);
                return {
                    success: false,
                    error: 'Account is not active',
                    code: 'auth/account-disabled'
                };
            }
            
            console.log('✅ DEBUG: Firestore authentication successful');
            this.currentUser = {
                email: user.email,
                uid: user.uid,
                role: user.role || 'user',
                name: user.name,
                username: user.username,
                status: user.status
            };
            
            // Store in sessionStorage for user management system
                sessionStorage.setItem('adminEmail', user.email);
                sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                // Store username separately for easy access
                if (user.username) {
                    sessionStorage.setItem('username', user.username);
                }
                console.log('💾 DEBUG: Session storage updated with adminEmail, currentUser, and username');
            
            return {
                success: true,
                user: this.currentUser,
                message: 'Login successful'
            };
            
        } catch (error) {
            console.error('💥 DEBUG: Login error occurred:', error);
            return {
                success: false,
                error: 'An error occurred during login',
                code: 'auth/unknown-error'
            };
        }
    }

    /**
     * Backward compatibility method for email-only login
     * @param {string} email - Email address
     * @param {string} password - User password
     * @returns {Promise<Object>} Authentication result
     */
    async signInWithEmailAndPassword(email, password) {
        return await this.signInWithEmailOrUsername(email, password);
    }

    /**
     * Validate if a string is a valid email format
     * @param {string} str - String to validate
     * @returns {boolean} True if valid email format
     */
    isValidEmail(str) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(str);
    }

    /**
     * Sign out current user
     * @returns {Promise<boolean>} Sign out success status
     */
    async signOut() {
        if (!this.isInitialized) {
            return false;
        }

        try {
            // Clear session storage
            sessionStorage.removeItem('adminEmail');
            localStorage.clear();
            this.currentUser = null;
            return true;
        } catch (error) {
            console.error('Sign out error:', error);
            return false;
        }
    }

    /**
     * Get user-friendly error message
     * @param {string} errorCode - Firebase error code
     * @returns {string} User-friendly error message
     */
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/invalid-credential': 'Invalid email or password. Please try again.',
            'auth/missing-password': 'Please enter your password.',
            'auth/weak-password': 'Password should be at least 6 characters long.'
        };

        return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
    }

    /**
     * Check if user is currently authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Get current user
     * @returns {Object|null} Current user object
     */
    getCurrentUser() {
        return this.currentUser;
    }
}

/**
 * Login UI Manager Class
 * Handles all UI interactions and form management
 */
class LoginUIManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.loginForm = null;
        this.emailInput = null;
        this.passwordInput = null;
        this.loginButton = null;
        this.messageContainer = null;
        this.isLoading = false;
    }

    /**
     * Initialize UI components and event listeners
     */
    initialize() {
        // Get DOM elements
        this.loginForm = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.loginButton = document.getElementById('loginButton');
        this.messageContainer = document.getElementById('messageContainer');

        // Validate required elements
        if (!this.loginForm || !this.emailInput || !this.passwordInput || !this.loginButton) {
            console.error('Required form elements not found');
            return false;
        }

        // Set up event listeners
        this.setupEventListeners();
        
        console.log('Login UI initialized successfully');
        return true;
    }

    /**
     * Set up form event listeners
     */
    setupEventListeners() {
        // Form submission
        this.loginForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Input validation on blur
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());

        // Clear messages on input
        this.emailInput.addEventListener('input', () => this.clearMessages());
        this.passwordInput.addEventListener('input', () => this.clearMessages());

        // Forgot password link (if exists)
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => this.handleForgotPassword(e));
        }
        
        // Username input restrictions for login field
        this.setupUsernameInputRestrictions();
        
        // Password toggle functionality
        this.setupPasswordToggle();
    }

    /**
     * Setup username input restrictions for the email/username field
     * Prevents spaces when used as username and enforces character restrictions
     */
    setupUsernameInputRestrictions() {
        if (!this.emailInput) return;
        
        // Prevent spaces when not typing an email (no @ symbol)
        this.emailInput.addEventListener('keypress', (e) => {
            const currentValue = this.emailInput.value;
            const char = String.fromCharCode(e.which);
            
            // If there's no @ symbol and user tries to type space, prevent it
            if (e.which === 32 && !currentValue.includes('@')) {
                e.preventDefault();
                return;
            }
            
            // If no @ symbol, enforce username character restrictions
            if (!currentValue.includes('@') && char !== '@') {
                const allowedPattern = /[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
                if (!allowedPattern.test(char)) {
                    e.preventDefault();
                }
            }
        });
        
        // Clean up pasted content for username format
        this.emailInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                const value = this.emailInput.value;
                // If it doesn't look like an email, clean it as username
                if (!value.includes('@')) {
                    const cleaned = value.replace(/[^A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '');
                    this.emailInput.value = cleaned;
                }
            }, 0);
        });
        
        // Remove invalid characters when used as username
        this.emailInput.addEventListener('input', (e) => {
            const value = e.target.value;
            // If it doesn't contain @ and isn't being typed as email, treat as username
            if (!value.includes('@')) {
                const cleaned = value.replace(/[^A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '');
                if (value !== cleaned) {
                    e.target.value = cleaned;
                }
            }
        });
    }

    /**
     * Setup password toggle functionality
     * Handles show/hide password functionality for the login form
     */
    setupPasswordToggle() {
        const toggleButton = document.getElementById('passwordToggle');
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('passwordToggleIcon');
        
        if (toggleButton && passwordInput && toggleIcon) {
            toggleButton.addEventListener('click', () => {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                toggleIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                toggleButton.title = isPassword ? 'Hide Password' : 'Show Password';
            });
        }
    }

    /**
     * Handle form submission
     * @param {Event} event - Form submit event
     */
    async handleFormSubmit(event) {
        console.log('📝 DEBUG: Form submission started');
        event.preventDefault();

        if (this.isLoading) {
            console.log('⏳ DEBUG: Already loading, ignoring submission');
            return;
        }

        // Validate inputs
        console.log('✅ DEBUG: Starting form validation');
        if (!this.validateForm()) {
            console.log('❌ DEBUG: Form validation failed');
            return;
        }
        console.log('✅ DEBUG: Form validation passed');

        // Get form data
        const emailOrUsername = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        
        console.log('📧 DEBUG: Email/Username from form:', emailOrUsername);
        console.log('🔑 DEBUG: Password length from form:', password ? password.length : 0);

        // Set loading state
        this.setLoadingState(true);
        this.clearMessages();

        try {
            console.log('🚀 DEBUG: Attempting authentication...');
            // Attempt login
            const result = await this.authManager.signInWithEmailOrUsername(emailOrUsername, password);
            
            console.log('📊 DEBUG: Authentication result:', result);

            if (result.success) {
                console.log('🎉 DEBUG: Login successful, redirecting immediately');
                // Redirect all users to dashboard main page
                console.log('🔄 DEBUG: Redirecting to dashboard...');
                window.location.href = './ml/index.html';
            } else {
                console.log('❌ DEBUG: Login failed, showing error message:', result.error);
                this.showErrorMessage(result.error);
            }
        } catch (error) {
            console.error('💥 DEBUG: Login process error:', error);
            this.showErrorMessage('An unexpected error occurred. Please try again.');
        } finally {
            console.log('🏁 DEBUG: Setting loading state to false');
            this.setLoadingState(false);
        }
    }

    /**
     * Validate form inputs
     * @returns {boolean} Validation result
     */
    validateForm() {
        let isValid = true;

        // Validate email
        if (!this.validateEmail()) {
            isValid = false;
        }

        // Validate password
        if (!this.validatePassword()) {
            isValid = false;
        }

        return isValid;
    }

    /**
     * Validate email or username input
     * @returns {boolean} Validation result
     */
    validateEmail() {
        const emailOrUsername = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[A-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/i; // Allow uppercase, numbers, and special chars, no spaces

        if (!emailOrUsername) {
            this.showFieldError(this.emailInput, 'Email or username is required');
            return false;
        }

        // Check if it's an email format
        if (emailOrUsername.includes('@')) {
            if (!emailRegex.test(emailOrUsername)) {
                this.showFieldError(this.emailInput, 'Please enter a valid email address');
                return false;
            }
        } else {
            // It's a username, validate username format
            if (!usernameRegex.test(emailOrUsername)) {
                this.showFieldError(this.emailInput, 'Username can only contain letters, numbers, and special characters (no spaces)');
                return false;
            }
            if (emailOrUsername.length < 3) {
                this.showFieldError(this.emailInput, 'Username must be at least 3 characters long');
                return false;
            }
        }

        this.clearFieldError(this.emailInput);
        return true;
    }

    /**
     * Validate password input
     * @returns {boolean} Validation result
     */
    validatePassword() {
        const password = this.passwordInput.value;

        if (!password) {
            this.showFieldError(this.passwordInput, 'Password is required');
            return false;
        }

        if (password.length < 6) {
            this.showFieldError(this.passwordInput, 'Password must be at least 6 characters long');
            return false;
        }

        this.clearFieldError(this.passwordInput);
        return true;
    }

    /**
     * Show field-specific error
     * @param {HTMLElement} field - Input field element
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
        // Remove existing error
        this.clearFieldError(field);

        // Add error class
        field.classList.add('error');

        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;

        // Check if field is inside a password wrapper
        const passwordWrapper = field.closest('.password-input-wrapper');
        if (passwordWrapper) {
            // Insert after the password wrapper
            passwordWrapper.parentNode.insertBefore(errorElement, passwordWrapper.nextSibling);
        } else {
            // Insert after field for regular inputs
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        }
    }

    /**
     * Clear field-specific error
     * @param {HTMLElement} field - Input field element
     */
    clearFieldError(field) {
        field.classList.remove('error');
        
        // Check if field is inside a password wrapper
        const passwordWrapper = field.closest('.password-input-wrapper');
        if (passwordWrapper) {
            // Look for error element after the password wrapper
            const errorElement = passwordWrapper.parentNode.querySelector('.field-error');
            if (errorElement) {
                errorElement.remove();
            }
        } else {
            // Look for error element after the field for regular inputs
            const errorElement = field.parentNode.querySelector('.field-error');
            if (errorElement) {
                errorElement.remove();
            }
        }
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.loginButton.disabled = true;
            this.loginButton.innerHTML = `
                <div class="loading-spinner"></div>
                Signing In...
            `;
        } else {
            this.loginButton.disabled = false;
            this.loginButton.innerHTML = `
                <i class="fas fa-sign-in-alt"></i>
                Sign In
            `;
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
        if (!this.messageContainer) return;

        this.messageContainer.innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                ${message}
            </div>
        `;
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showErrorMessage(message) {
        if (!this.messageContainer) return;

        this.messageContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                ${message}
            </div>
        `;
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        if (this.messageContainer) {
            this.messageContainer.innerHTML = '';
        }
    }

    /**
     * Handle forgot password link click
     * @param {Event} event - Click event
     */
    handleForgotPassword(event) {
        event.preventDefault();
        
        // For now, show a message - can be extended later
        this.showErrorMessage('Password reset functionality will be available soon. Please contact an administrator.');
    }
}

/**
 * Initialize authentication and UI when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 DEBUG: DOM Content Loaded - Starting login system initialization');
    
    try {
        // Initialize authentication manager
        console.log('🔧 DEBUG: Creating AuthenticationManager instance');
        const authManager = new AuthenticationManager();
        console.log('🔧 DEBUG: AuthenticationManager created, initializing...');
        const initialized = await authManager.initialize();
        
        console.log('🔧 DEBUG: AuthenticationManager initialization result:', initialized);
        if (!initialized) {
            console.error('❌ DEBUG: Failed to initialize authentication');
            return;
        }

        // Check for existing authentication session
        console.log('🔍 DEBUG: Checking for existing session...');
        const existingSession = sessionStorage.getItem('adminEmail');
        console.log('🔍 DEBUG: Existing session found:', existingSession);
        
        if (existingSession) {
            // User is already signed in, redirect to dashboard
            console.log('✅ DEBUG: User already authenticated, redirecting to dashboard');
            window.location.href = './ml/index.html';
            return;
        }

        // Initialize UI manager
        console.log('🎨 DEBUG: Creating LoginUIManager instance');
        const uiManager = new LoginUIManager(authManager);
        console.log('🎨 DEBUG: LoginUIManager created, initializing...');
        const uiInitialized = uiManager.initialize();
        
        console.log('🎨 DEBUG: LoginUIManager initialization result:', uiInitialized);
        if (!uiInitialized) {
            console.error('❌ DEBUG: Failed to initialize login UI');
            return;
        }

        console.log('🎉 DEBUG: Login system initialized successfully');
        console.log('📋 DEBUG: Authentication system ready with Firestore integration');
        
    } catch (error) {
        console.error('💥 DEBUG: Failed to initialize login system:', error);
        
        // Show error message to user
        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer) {
            messageContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    Failed to initialize login system. Please refresh the page.
                </div>
            `;
        }
    }
});

// Export for potential external use
window.AuthenticationManager = AuthenticationManager;
window.LoginUIManager = LoginUIManager;