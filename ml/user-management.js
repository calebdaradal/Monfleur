/**
 * User Management System
 * Handles admin operations for user creation, deletion, and management
 * Uses Firestore-only approach without Firebase Authentication
 */

// Import Firebase modules and configuration
import firebaseConfig from './config/firebase-config.js';
import AuthenticationService from './services/authentication-service.js';
import LoggingService from './services/logging-service.js';

/**
 * User Management Class
 * Handles all user management operations following SOLID principles
 */
class UserManagementSystem {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.currentAdmin = null;
        this.users = [];
        this.authService = new AuthenticationService();
    }

    /**
     * Initialize Firebase services (Firestore only)
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            // Initialize Firebase config
            const configInitialized = await firebaseConfig.initialize();
            if (!configInitialized) {
                throw new Error('Firebase configuration failed');
            }

            // Initialize authentication service
            const authInitialized = await this.authService.initialize();
            if (!authInitialized) {
                throw new Error('Authentication service initialization failed');
            }

            // Import and initialize Firestore only
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
            
            // Restore session if available
            this.authService.restoreSession();
            this.currentAdmin = this.authService.getCurrentUser();
            
            console.log('User Management System initialized successfully (Firestore only)');
            return true;
        } catch (error) {
            console.error('User Management initialization failed:', error);
            return false;
        }
    }

    /**
     * Set current admin user (simplified approach)
     * @param {string} email - Admin email
     * @returns {boolean} Success status
     */
    setCurrentAdmin(email) {
        // This method is now deprecated - authentication service handles current user
        console.warn('⚠️ setCurrentAdmin is deprecated. Use AuthenticationService instead.');
        
        // For backward compatibility, delegate to authentication service
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.email === email) {
            this.currentAdmin = {
                email: currentUser.email,
                uid: currentUser.uid,
                role: currentUser.role,
                username: currentUser.username
            };
            console.log('✅ Current admin set from authentication service:', this.currentAdmin);
            return true;
        } else {
            console.warn('⚠️ User not authenticated or email mismatch:', email);
            return false;
        }
    }

    /**
     * Check if current user has admin privileges (any admin role)
     * Redirects moderators to profile settings and non-authenticated users to login
     * @returns {boolean} Admin status
     */
    checkAdminPrivileges() {
        const adminEmail = sessionStorage.getItem('adminEmail');
        if (!adminEmail) {
            console.warn('⚠️ No authenticated user found');
            window.location.href = '../login.html';
            return false;
        }

        // Set current admin if not already set
        if (!this.currentAdmin) {
            this.setCurrentAdmin(adminEmail);
        }

        // Check if user is a moderator (should go to profile settings)
        if (this.isModerator()) {
            console.log('🔄 Moderator detected, redirecting to Profile Settings');
            window.location.href = 'profile-settings.html';
            return false;
        }

        // Check if user is an administrator
        if (!this.isAdministrator()) {
            console.warn('⚠️ Unauthorized access attempt - insufficient privileges');
            window.location.href = '../login.html';
            return false;
        }

        return true;
    }

    /**
     * Check if current user is an administrator (highest privilege)
     * @returns {boolean} Administrator status
     */
    isAdministrator() {
        return this.authService.isAdministrator();
    }

    /**
     * Check if current user is a moderator
     * @returns {boolean} Moderator status
     */
    isModerator() {
        return this.authService.isModerator();
    }

    /**
     * Get current user's role
     * @returns {string|null} Current user role
     */
    getCurrentUserRole() {
        return this.authService.getCurrentUserRole();
    }

    /**
     * Get current authenticated user
     * @returns {Object|null} Current user object
     */
    getCurrentUser() {
        return this.authService.getCurrentUser();
    }

    /**
     * Get user role from Firestore
     * @param {string} uid - User ID
     * @returns {Promise<Object|null>} User data
     */
    async getUserRole(uid) {
        try {
            if (!this.isInitialized) {
                throw new Error('User Management System not initialized');
            }

            const { getDocs, query, collection, where } = this.firestoreFunctions;
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('uid', '==', uid));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data();
            }
            return null;
        } catch (error) {
            console.error('Error getting user role:', error);
            return null;
        }
    }

    /**
     * Create a new user (Firestore only)
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Creation result
     */
    async createUser(userData) {
        if (!this.isInitialized) {
            throw new Error('User Management System not initialized');
        }

        try {
            // Generate a unique ID for the user
            const uid = crypto.randomUUID();
            
            // Validate required fields
            if (!userData.email || !userData.username) {
                throw new Error('Email and username are required');
            }

            // Check if user already exists
            const existingUser = await this.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Store user data in Firestore
            const userDoc = {
                uid: uid,
                email: userData.email,
                username: userData.username || '',

                role: userData.role || 'user',
                active: userData.active !== undefined ? userData.active : true,
                // Hash password before storage (using Web Crypto API)
                password: await this.hashPassword(userData.password || ''),
                createdAt: new Date().toISOString(),
                createdBy: this.currentAdmin?.uid || 'system'
            };

            await this.firestoreFunctions.addDoc(
                this.firestoreFunctions.collection(this.db, 'users'),
                userDoc
            );

            return {
                success: true,
                user: userDoc,
                message: 'User created successfully'
            };
        } catch (error) {
            console.error('Error creating user:', error);
            return {
                success: false,
                error: error.message || 'Failed to create user',
                code: error.code || 'UNKNOWN_ERROR'
            };
        }
    }

    /**
     * Get user by email
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User data or null
     */
    async getUserByEmail(email) {
        try {
            const { getDocs, query, collection, where } = this.firestoreFunctions;
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                return {
                    id: userDoc.id,
                    ...userDoc.data()
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
    }

    /**
     * Delete a user (Firestore only)
     * @param {string} uid - User ID to delete
     * @returns {Promise<Object>} Deletion result
     */
    async deleteUser(uid) {
        if (!this.isInitialized) {
            throw new Error('User Management System not initialized');
        }

        try {
            // Check if trying to delete an admin account
            if (uid.startsWith('admin-')) {
                return {
                    success: false,
                    error: 'Cannot delete admin accounts',
                    code: 'ADMIN_DELETE_DENIED'
                };
            }

            // Remove user from Firestore
            const { getDocs, query, collection, where } = this.firestoreFunctions;
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('uid', '==', uid));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                await this.firestoreFunctions.deleteDoc(userDoc.ref);
                
                return {
                    success: true,
                    message: 'User deleted successfully from database'
                };
            } else {
                return {
                    success: false,
                    error: 'User not found in database',
                    code: 'USER_NOT_FOUND'
                };
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            return {
                success: false,
                error: 'Failed to delete user: ' + (error.message || 'Unknown error'),
                code: error.code || 'UNKNOWN_ERROR'
            };
        }
    }



    /**
     * Get all users from Firestore
     * @returns {Promise<Array>} List of users
     */
    /**
     * Get all users from Firestore
     * @returns {Promise<Array>} List of users
     */
    async getAllUsers() {
        if (!this.isInitialized) {
            throw new Error('User Management System not initialized');
        }

        try {
            const users = [];
            
            // Get users from Firestore
            const { getDocs, collection, orderBy, query } = this.firestoreFunctions;
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            
            querySnapshot.forEach((doc) => {
                users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.users = users;
            return users;
        } catch (error) {
            console.error('Error getting users from Firestore:', error);
            return [];
        }
    }

    /**
     * Update user role
     * @param {string} uid - User ID
     * @param {string} newRole - New role
     * @returns {Promise<Object>} Update result
     */
    async updateUserRole(uid, newRole) {
        if (!this.isInitialized) {
            throw new Error('User Management System not initialized');
        }

        try {
            const { getDocs, query, collection, where, updateDoc } = this.firestoreFunctions;
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('uid', '==', uid));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                await updateDoc(userDoc.ref, {
                    role: newRole,
                    updatedAt: new Date().toISOString(),
                    updatedBy: this.currentAdmin?.uid || 'system'
                });
            }

            return {
                success: true,
                message: 'User role updated successfully'
            };
        } catch (error) {
            console.error('Error updating user role:', error);
            return {
                success: false,
                error: 'Failed to update user role'
            };
        }
    }

    /**
     * Update user data
     * @param {string} uid - User ID
     * @param {Object} userData - Updated user data
     * @returns {Promise<Object>} Update result
     */
    async updateUser(uid, userData) {
        if (!this.isInitialized) {
            throw new Error('User Management System not initialized');
        }

        try {
            const { getDocs, query, collection, where, updateDoc } = this.firestoreFunctions;
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('uid', '==', uid));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            const userDoc = querySnapshot.docs[0];
            const updateData = {
                username: userData.username,
                email: userData.email,
                role: userData.role,
                active: userData.active,
                updatedAt: new Date().toISOString(),
                updatedBy: this.currentAdmin?.uid || 'system'
            };

            // Only update password if provided
            if (userData.password && userData.password.trim() !== '') {
                const hashedPassword = await this.hashPassword(userData.password);
                updateData.password = hashedPassword;
            }

            await updateDoc(userDoc.ref, updateData);

            // Update local users array
            const userIndex = this.users.findIndex(user => user.uid === uid);
            if (userIndex !== -1) {
                this.users[userIndex] = { ...this.users[userIndex], ...updateData };
            }

            return {
                success: true,
                message: 'User updated successfully'
            };
        } catch (error) {
            console.error('Error updating user:', error);
            return {
                success: false,
                error: this.getErrorMessage(error.code) || 'Failed to update user'
            };
        }
    }

    /**
     * Get user statistics
     * @returns {Object} User statistics
     */
    getUserStatistics() {
        const stats = {
            total: this.users.length,
            active: this.users.filter(user => user.active === true).length,
            admins: this.users.filter(user => user.role === 'admin' || user.role === 'super-admin').length,
            moderators: this.users.filter(user => user.role === 'moderator').length,
            users: this.users.filter(user => user.role === 'user').length
        };

        return stats;
    }

    /**
     * Hash password using Web Crypto API
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    async hashPassword(password) {
        try {
            // Check if crypto.subtle is available
            if (crypto && crypto.subtle) {
                // Convert password to ArrayBuffer
                const encoder = new TextEncoder();
                const data = encoder.encode(password);
                
                // Hash the password using SHA-256
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                
                // Convert ArrayBuffer to hex string
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                
                return 'sha256:' + hashHex; // Prefix to identify hash type
            } else {
                // Fallback to base64 encoding if crypto.subtle is not available
                console.warn('crypto.subtle not available, using base64 fallback');
                return 'base64:' + btoa(password);
            }
        } catch (error) {
            console.error('Error hashing password:', error);
            // Fallback to base64 encoding
            console.warn('Falling back to base64 encoding due to error');
            return 'base64:' + btoa(password);
        }
    }

    /**
     * Verify password against stored hash
     * @param {string} password - Plain text password
     * @param {string} storedHash - Stored password hash
     * @returns {Promise<boolean>} Password matches
     */
    async verifyPassword(password, storedHash) {
        try {
            // Check if stored hash has a prefix to identify hash type
            if (storedHash.startsWith('sha256:')) {
                // Use SHA-256 verification
                const hashedInput = await this.hashPassword(password);
                return hashedInput === storedHash;
            } else if (storedHash.startsWith('base64:')) {
                // Use base64 verification
                const base64Hash = 'base64:' + btoa(password);
                return base64Hash === storedHash;
            } else {
                // Legacy hash without prefix - try both methods
                
                // Try current hashing method first
                const hashedInput = await this.hashPassword(password);
                if (hashedInput === storedHash) {
                    return true;
                }
                
                // Try base64 fallback
                const base64Test = btoa(password);
                if (base64Test === storedHash) {
                    return true;
                }
                
                // Try SHA-256 without prefix (legacy)
                if (crypto && crypto.subtle) {
                    try {
                        const encoder = new TextEncoder();
                        const data = encoder.encode(password);
                        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                        if (hashHex === storedHash) {
                            return true;
                        }
                    } catch (legacyError) {
                        console.warn('Legacy SHA-256 verification failed:', legacyError);
                    }
                }
                
                return false;
            }
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    }

    /**
     * Authenticate user login using authentication service
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Authentication result
     */
    async authenticateUser(email, password) {
        try {
            // Use authentication service for all authentication
            const authResult = await this.authService.authenticateUser(email, password);
            
            if (authResult.success) {
                // Set current admin in this system
                this.currentAdmin = authResult.user;
                
                // Set user in authentication service session
                this.authService.setCurrentUser(authResult.user);
            }
            
            return authResult;
        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: 'Authentication failed. Please try again.',
                code: 'AUTH_ERROR'
            };
        }
    }

    /**
     * Get user-friendly error messages
     * @param {string} errorCode - Firebase error code
     * @returns {string} User-friendly error message
     */
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': 'This email address is already registered.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/too-many-requests': 'Too many requests. Please try again later.',
            'permission-denied': 'You do not have permission to perform this action.',
            'unavailable': 'Service temporarily unavailable. Please try again later.',
            'INVALID_CREDENTIALS': 'Invalid email or password.',
            'ACCOUNT_INACTIVE': 'Account is inactive. Please contact an administrator.',
            'AUTH_ERROR': 'Authentication failed. Please try again.'
        };

        return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
    }
}

/**
 * User Management UI Handler
 * Manages the user interface and user interactions
 */
class UserManagementUI {
    constructor(userManagement) {
        this.userManagement = userManagement;
        this.messageContainer = document.getElementById('messageContainer');
        this.addUserForm = document.getElementById('addUserForm');
        this.usersTableBody = document.getElementById('usersTableBody');
        this.emptyState = document.getElementById('emptyState');
        this.deleteModal = document.getElementById('deleteModal');
        this.userToDelete = null;
        
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add user form submission
        this.addUserForm.addEventListener('submit', this.handleAddUser.bind(this));
        
        // Refresh users button
        document.getElementById('refreshUsersButton').addEventListener('click', () => {
            this.loadUsers(true); // Show success message for manual refresh
        });
        
        // Modal event listeners
        document.getElementById('closeModal').addEventListener('click', this.hideDeleteModal.bind(this));
        document.getElementById('cancelDelete').addEventListener('click', this.hideDeleteModal.bind(this));
        document.getElementById('confirmDelete').addEventListener('click', this.handleDeleteUser.bind(this));
        
        // Close modal when clicking outside
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) {
                this.hideDeleteModal();
            }
        });
        
        // Username input restrictions
        this.setupUsernameInputRestrictions();
        
        // Password generator functionality
        this.setupPasswordGenerator();
        
        // Username generator (also updates display name)
        this.setupUsernameGenerator();
        
        // Cancel edit button
        document.getElementById('cancelEditButton').addEventListener('click', () => {
            this.setEditMode(false);
            this.showMessage('Edit cancelled', 'info');
        });
        
        // Toggle active status text update
        this.setupToggleTextUpdate();
        
        // Password toggle functionality
        this.setupPasswordToggle();
    }
    
    /**
     * Setup password toggle functionality
     */
    setupPasswordToggle() {
        const toggleButtons = document.querySelectorAll('.password-toggle-btn');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                const icon = button.querySelector('i');
                
                if (passwordInput && icon) {
                    const isPassword = passwordInput.type === 'password';
                    passwordInput.type = isPassword ? 'text' : 'password';
                    icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                    button.title = isPassword ? 'Hide Password' : 'Show Password';
                }
            });
        });
    }

    /**
     * Setup toggle text update functionality
     * Updates the toggle text based on the checkbox state
     */
    setupToggleTextUpdate() {
        const toggleInput = document.getElementById('userActive');
        const toggleText = document.querySelector('.toggle-text');
        
        if (toggleInput && toggleText) {
            // Set initial text based on current state
            toggleText.textContent = toggleInput.checked ? 'Active' : 'Inactive';
            
            // Add event listener for state changes
            toggleInput.addEventListener('change', () => {
                toggleText.textContent = toggleInput.checked ? 'Active' : 'Inactive';
            });
        }
    }

    /**
     * Setup username input field restrictions
     * Prevents spaces and allows letters (both cases), numbers, and special characters
     */
    setupUsernameInputRestrictions() {
        const usernameInput = document.getElementById('userUsername');
        if (!usernameInput) return;
        
        // Prevent spaces and invalid characters on keypress
        usernameInput.addEventListener('keypress', (e) => {
            const char = String.fromCharCode(e.which);
            const allowedPattern = /[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
            
            // Prevent space character
            if (e.which === 32) {
                e.preventDefault();
                return;
            }
            
            // Only allow valid characters
            if (!allowedPattern.test(char)) {
                e.preventDefault();
            }
        });
        
        // Clean up pasted content
        usernameInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const cleaned = paste.replace(/[^A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '');
            usernameInput.value = cleaned;
        });
        
        // Remove invalid characters on input
        usernameInput.addEventListener('input', (e) => {
            const value = e.target.value;
            const cleaned = value.replace(/[^A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '');
            if (value !== cleaned) {
                e.target.value = cleaned;
            }
        });
    }

    /**
     * Setup password generator functionality
     * Handles auto-generation, regenerate button, and copy button
     */
    setupPasswordGenerator() {
        const passwordInput = document.getElementById('userPassword');
        const regenerateBtn = document.getElementById('regeneratePassword');
        const copyBtn = document.getElementById('copyPassword');
        
        if (!passwordInput || !regenerateBtn || !copyBtn) return;
        
        // Generate initial password
        this.generatePassword();
        
        // Regenerate button click handler
        regenerateBtn.addEventListener('click', () => {
            this.generatePassword();
            this.showPasswordFeedback('New password generated!', 'success');
        });
        
        // Copy button click handler
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(passwordInput.value);
                this.showPasswordFeedback('Password copied to clipboard!', 'success');
            } catch (err) {
                // Fallback for older browsers
                passwordInput.select();
                document.execCommand('copy');
                this.showPasswordFeedback('Password copied to clipboard!', 'success');
            }
        });
    }

    /**
     * Generate a random 6-character password
     * Uses a mix of uppercase, lowercase, numbers, and safe special characters
     */
    generatePassword() {
        const passwordInput = document.getElementById('userPassword');
        if (!passwordInput) return;
        
        // Character sets for password generation
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const specialChars = '!@#$%^&*';
        
        // Combine all character sets
        const allChars = uppercase + lowercase + numbers + specialChars;
        
        // Generate 6-character password
        let password = '';
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * allChars.length);
            password += allChars[randomIndex];
        }
        
        passwordInput.value = password;
    }

    /**
     * Show temporary feedback message for password actions
     * @param {string} message - Message to display
     * @param {string} type - Message type ('success' or 'error')
     */
    showPasswordFeedback(message, type) {
        // Remove any existing feedback
        const existingFeedback = document.querySelector('.password-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = `password-feedback ${type}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            position: absolute;
            top: -30px;
            right: 0;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out;
        `;
        
        // Add CSS animation if not already present
        if (!document.querySelector('#password-feedback-styles')) {
            const style = document.createElement('style');
            style.id = 'password-feedback-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(10px); }
                    20% { opacity: 1; transform: translateY(0); }
                    80% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add feedback to password container
        const passwordContainer = document.querySelector('.password-generator-container');
        if (passwordContainer) {
            passwordContainer.style.position = 'relative';
            passwordContainer.appendChild(feedback);
            
            // Remove feedback after animation
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.remove();
                }
            }, 2000);
        }
    }

    /**
     * Setup username generator functionality
     * Initializes username field with generated value and sets up event listeners
     */
    setupUsernameGenerator() {
        // Generate initial username
        this.generateUsername();
        
        // Setup regenerate button
        const regenerateBtn = document.getElementById('regenerateUsername');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                this.generateUsername();
                this.showUsernameFeedback('New username generated!', 'success');
            });
        }
        
        // Setup copy button
        const copyBtn = document.getElementById('copyUsername');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                const usernameInput = document.getElementById('userUsername');
                if (usernameInput && usernameInput.value) {
                    try {
                        await navigator.clipboard.writeText(usernameInput.value);
                        this.showUsernameFeedback('Username copied!', 'success');
                    } catch (err) {
                        // Fallback for older browsers
                        usernameInput.select();
                        document.execCommand('copy');
                        this.showUsernameFeedback('Username copied!', 'success');
                    }
                } else {
                    this.showUsernameFeedback('No username to copy', 'error');
                }
            });
        }
    }



    /**
     * Generate a random username by combining adjective and animal
     * Uses concatenated format without underscore: AdjectiveAnimal
     */
    async generateUsername() {
        try {
            const adjectives = await this.loadWordList('../data/usernames/adjectives');
            const animals = await this.loadWordList('../data/usernames/animals');
            
            const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
            const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
            
            // Create concatenated username: AdjectiveAnimal (no underscore)
            const username = `${randomAdjective}${randomAnimal}`;
            
            const usernameInput = document.getElementById('userUsername');
            
            if (usernameInput) {
                usernameInput.value = username;
            }
        } catch (error) {
            console.error('Error generating username:', error);
            // Fallback to simple random username
            const fallbackId = Math.random().toString(36).substr(2, 6);
            const fallbackUsername = `User${fallbackId}`;
            
            const usernameInput = document.getElementById('userUsername');
            
            if (usernameInput) {
                usernameInput.value = fallbackUsername;
            }
        }
    }



    /**
     * Load word list from file
     * @param {string} filePath - Path to the word list file
     * @returns {Promise<string[]>} Array of words
     */
    async loadWordList(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load word list: ${response.status}`);
            }
            const text = await response.text();
            return text.split('\n').map(word => word.trim()).filter(word => word.length > 0);
        } catch (error) {
            console.error(`Error loading word list from ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Show temporary feedback message for username actions
     * @param {string} message - Message to display
     * @param {string} type - Message type ('success' or 'error')
     */
    showUsernameFeedback(message, type) {
        this.showFeedback(message, type, '.username-generator-container', 'username-feedback');
    }



    /**
     * Generic feedback display method
     * @param {string} message - Message to display
     * @param {string} type - Message type ('success' or 'error')
     * @param {string} containerSelector - CSS selector for container
     * @param {string} feedbackClass - CSS class for feedback element
     */
    showFeedback(message, type, containerSelector, feedbackClass) {
        // Remove any existing feedback
        const existingFeedback = document.querySelector(`.${feedbackClass}`);
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = `${feedbackClass} ${type}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            position: absolute;
            top: -30px;
            right: 0;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out;
        `;
        
        // Add CSS animation if not already present
        if (!document.querySelector('#generator-feedback-styles')) {
            const style = document.createElement('style');
            style.id = 'generator-feedback-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(10px); }
                    20% { opacity: 1; transform: translateY(0); }
                    80% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add feedback to container
        const container = document.querySelector(containerSelector);
        if (container) {
            container.style.position = 'relative';
            container.appendChild(feedback);
            
            // Remove feedback after animation
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.remove();
                }
            }, 2000);
        }
    }

    /**
     * Handle add user form submission
     * @param {Event} event - Form submit event
     */
    async handleAddUser(event) {
        event.preventDefault();
        
        const formData = new FormData(this.addUserForm);
        const userData = {
            email: document.getElementById('userEmail').value.trim(),
            password: document.getElementById('userPassword').value,
            username: document.getElementById('userUsername').value.trim(),
            role: document.getElementById('userRole').value,
            active: document.getElementById('userActive').checked
        };
        
        // Check if we're in edit mode
        const isEditMode = this.editingUserId !== null && this.editingUserId !== undefined;
        
        // Basic validation
        if (!userData.email || !userData.username || !userData.role) {
            this.showMessage('Please fill in all required fields.', 'error');
            return;
        }
        
        // Password validation - required for new users, optional for editing
        if (!isEditMode && !userData.password) {
            this.showMessage('Password is required for new users.', 'error');
            return;
        }
        
        if (!this.isValidEmail(userData.email)) {
            this.showMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        // Show loading state
        this.setFormLoadingState(true);
        this.clearMessages();
        
        try {
            let result;
            const currentAdmin = this.userManagement.getCurrentUser();
            const adminUsername = currentAdmin ? currentAdmin.username : 'Unknown Admin';
            
            if (isEditMode) {
                // Get original user data for logging comparison
                const originalUser = this.userManagement.users.find(u => u.uid === this.editingUserId);
                
                // Update existing user
                result = await this.userManagement.updateUser(this.editingUserId, userData);
                
                if (result.success) {
                    // Log user edit action
                    try {
                        const logPromises = [];
                        
                        // Log username change if it occurred
                        if (originalUser && originalUser.username !== userData.username) {
                            logPromises.push(
                                LoggingService.logUserActivity(
                                    'USER_EDIT',
                                    adminUsername,
                                    userData.username,
                                    {
                                        oldUsername: originalUser.username,
                                        newUsername: userData.username,
                                        performedByAdmin: true
                                    }
                                )
                            );
                        }
                        
                        // Log role change if it occurred
                        if (originalUser && originalUser.role !== userData.role) {
                            logPromises.push(
                                LoggingService.logUserActivity(
                                    'ROLE_CHANGE',
                                    adminUsername,
                                    userData.username,
                                    {
                                        oldRole: originalUser.role,
                                        newRole: userData.role,
                                        performedByAdmin: true
                                    }
                                )
                            );
                        }
                        
                        // Log status change if it occurred
                        if (originalUser && originalUser.active !== userData.active) {
                            logPromises.push(
                                LoggingService.logUserActivity(
                                    'ADMIN_EDIT',
                                    adminUsername,
                                    userData.username,
                                    {
                                        action: 'status_change',
                                        newStatus: userData.active,
                                        performedByAdmin: true
                                    }
                                )
                            );
                        }
                        
                        // Log password change if password was provided
                        if (userData.password) {
                            logPromises.push(
                                LoggingService.logUserActivity(
                                    'PASSWORD_CHANGE',
                                    adminUsername,
                                    userData.username,
                                    {
                                        performedByAdmin: true
                                    }
                                )
                            );
                        }
                        
                        // If no specific changes were logged, log a general edit
                        if (logPromises.length === 0) {
                            logPromises.push(
                                LoggingService.logUserActivity(
                                    'EDIT',
                                    adminUsername,
                                    userData.username,
                                    {
                                        details: 'User profile updated by admin',
                                        performedByAdmin: true
                                    }
                                )
                            );
                        }
                        
                        await Promise.all(logPromises);
                        console.log('✅ User edit actions logged successfully');
                    } catch (logError) {
                        console.error('⚠️ Failed to log user edit actions:', logError);
                        // Don't fail the entire operation if logging fails
                    }
                }
            } else {
                // Create new user
                result = await this.userManagement.createUser(userData);
                
                if (result.success) {
                    // Log user creation
                    try {
                        await LoggingService.logUserActivity(
                            'ADMIN_EDIT',
                            adminUsername,
                            userData.username,
                            {
                                action: 'create',
                                email: userData.email,
                                role: userData.role,
                                active: userData.active,
                                performedByAdmin: true
                            }
                        );
                        console.log('✅ User creation logged successfully');
                    } catch (logError) {
                        console.error('⚠️ Failed to log user creation:', logError);
                        // Don't fail the entire operation if logging fails
                    }
                }
            }
            
            if (result.success) {
                this.showMessage(result.message, 'success');
                
                if (isEditMode) {
                    // Exit edit mode and reset form
                    this.setEditMode(false);
                } else {
                    // Reset form and generate new data for next user
                    this.addUserForm.reset();
                    this.generatePassword(); // Generate new password for next user
                    this.generateUsername(); // Generate new username and display name for next user
                }
                
                await this.loadUsers(); // Refresh user list
            } else {
                this.showMessage(result.error, 'error');
            }
        } catch (error) {
            console.error('Error processing user:', error);
            this.showMessage(isEditMode ? 'Failed to update user. Please try again.' : 'Failed to add user. Please try again.', 'error');
        } finally {
            this.setFormLoadingState(false);
        }
    }

    /**
     * Load and display users
     * @param {boolean} showSuccessMessage - Whether to show success message (for manual refresh)
     */
    async loadUsers(showSuccessMessage = false) {
        const refreshButton = document.getElementById('refreshUsersButton');
        const originalText = refreshButton ? refreshButton.innerHTML : null;
        
        try {
            // Set loading state only if refresh button exists (manual refresh)
            if (refreshButton && showSuccessMessage) {
                refreshButton.classList.add('loading');
                refreshButton.disabled = true;
                refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refreshing...';
                
                // Clear any existing messages
                this.clearMessages();
            }
            
            const users = await this.userManagement.getAllUsers();
            this.displayUsers(users);
            this.updateStatistics();
            
            // Show success message only for manual refresh
            if (showSuccessMessage) {
                this.showMessage(`Successfully refreshed ${users.length} user${users.length !== 1 ? 's' : ''}`, 'success');
            }
            
        } catch (error) {
            console.error('Error loading users:', error);
            const errorMessage = showSuccessMessage ? 'Failed to refresh users. Please try again.' : 'Failed to load users.';
            this.showMessage(errorMessage, 'error');
        } finally {
            // Restore button state only if it was modified
            if (refreshButton && showSuccessMessage && originalText) {
                refreshButton.classList.remove('loading');
                refreshButton.disabled = false;
                refreshButton.innerHTML = originalText;
            }
        }
    }

    /**
     * Display users in table
     * @param {Array} users - List of users
     */
    displayUsers(users) {
        if (users.length === 0) {
            this.usersTableBody.innerHTML = '';
            this.emptyState.style.display = 'block';
            return;
        }

        this.emptyState.style.display = 'none';
        
        this.usersTableBody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-name">${user.username || 'N/A'}</div>
                        <div class="user-id">${user.uid}</div>
                    </div>
                </td>
                <td>${user.username || 'N/A'}</td>
                <td>${user.email}</td>
                <td>
                    <span class="user-role-badge role-${user.role}">
                        ${user.role}
                    </span>
                </td>
                <td>
                    <div class="user-status">
                        <div class="status-indicator ${user.active !== false ? 'status-active' : 'status-inactive'}"></div>
                        <span>${user.active !== false ? 'Active' : 'Inactive'}</span>
                    </div>
                </td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-secondary" onclick="userManagementUI.editUser('${user.uid}')">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button class="btn-small btn-danger" onclick="userManagementUI.showDeleteModal('${user.uid}', '${user.email}')">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Update user statistics display
     */
    updateStatistics() {
        const stats = this.userManagement.getUserStatistics();
        
        document.getElementById('totalUsers').textContent = stats.total;
        document.getElementById('activeUsers').textContent = stats.active;
        document.getElementById('adminUsers').textContent = stats.admins;
        document.getElementById('moderatorUsers').textContent = stats.moderators;
    }

    /**
     * Show delete confirmation modal
     * @param {string} uid - User ID
     * @param {string} email - User email
     */
    showDeleteModal(uid, email) {
        this.userToDelete = uid;
        document.getElementById('deleteUserEmail').textContent = email;
        this.deleteModal.style.display = 'flex';
    }

    /**
     * Hide delete confirmation modal
     */
    hideDeleteModal() {
        this.deleteModal.style.display = 'none';
        this.userToDelete = null;
    }

    /**
     * Handle user deletion
     */
    async handleDeleteUser() {
        if (!this.userToDelete) {
            console.error('No user selected for deletion');
            this.showMessage('No user selected for deletion.', 'error');
            this.hideDeleteModal();
            return;
        }
        
        console.log('Attempting to delete user:', this.userToDelete);
        
        try {
            // Get user data before deletion for logging
            const deletedUser = this.userManagement.users.find(u => u.uid === this.userToDelete);
            const deletedUsername = deletedUser ? deletedUser.username : 'Unknown';
            const deletedUserEmail = deletedUser ? deletedUser.email : 'Unknown';
            
            // Show loading state
            const confirmButton = document.getElementById('confirmDelete');
            const originalText = confirmButton.innerHTML;
            confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            confirmButton.disabled = true;
            
            const result = await this.userManagement.deleteUser(this.userToDelete);
            
            console.log('Delete result:', result);
            
            if (result.success) {
                let message = result.message;
                
                // Add detailed information about what was deleted
                if (result.details) {
                    const { deletedFromAuth, deletedFromFirestore } = result.details;
                    if (deletedFromAuth && deletedFromFirestore) {
                        message += ' (Removed from both Authentication and Database)';
                    } else if (deletedFromFirestore && !deletedFromAuth) {
                        message += ' (Removed from Database only - Auth user may not have existed)';
                    }
                }
                
                // Log the user deletion action
                try {
                    const currentUser = this.userManagement.getCurrentUser();
                    
                    if (currentUser && currentUser.username) {
                        await LoggingService.logUserActivity(
                            'ADMIN_EDIT',
                            currentUser.username,
                            deletedUsername,
                            {
                                action: 'delete',
                                deletedUserId: this.userToDelete,
                                deletedUserEmail: deletedUserEmail,
                                adminAction: true,
                                deletionDetails: result.message || result.error || 'User deletion processed'
                            }
                        );
                    }
                } catch (loggingError) {
                    console.error('Failed to log user deletion:', loggingError);
                }
                
                // Show warning if present (for fallback method)
                if (result.warning) {
                    this.showMessage(message, 'warning');
                    setTimeout(() => {
                        this.showMessage(result.warning, 'info');
                    }, 3000);
                } else {
                    this.showMessage(message, 'success');
                }
                
                await this.loadUsers(); // Refresh user list
            } else {
                console.error('Delete failed:', result.error, 'Code:', result.code);
                this.showMessage(result.error || 'Failed to delete user', 'error');
            }
            
            // Restore button state
            confirmButton.innerHTML = originalText;
            confirmButton.disabled = false;
            
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showMessage('Failed to delete user: ' + (error.message || 'Unknown error'), 'error');
            
            // Restore button state
            const confirmButton = document.getElementById('confirmDelete');
            confirmButton.innerHTML = '<i class="fas fa-trash"></i> Delete User';
            confirmButton.disabled = false;
        } finally {
            this.hideDeleteModal();
        }
    }

    /**
     * Edit user - populate form fields for editing
     * @param {string} uid - User ID
     */
    async editUser(uid) {
        try {
            // Get user data from the users array
            const users = await this.userManagement.getAllUsers();
            const user = users.find(u => u.uid === uid);
            
            if (!user) {
                this.showMessage('User not found', 'error');
                return;
            }
            
            // Store the current editing user ID
            this.editingUserId = uid;
            
            // Populate form fields
            document.getElementById('userUsername').value = user.username || '';
            document.getElementById('userEmail').value = user.email || '';
            document.getElementById('userRole').value = user.role || 'user';
            
            // Set active status toggle
            const toggleInput = document.getElementById('userActive');
            const toggleText = document.querySelector('.toggle-text');
            if (toggleInput && toggleText) {
                toggleInput.checked = user.active !== false; // Default to true if not specified
                toggleText.textContent = toggleInput.checked ? 'Active' : 'Inactive';
            }
            
            // Clear password field (empty means no change)
            document.getElementById('userPassword').value = '';
            
            // Switch to edit mode
            this.setEditMode(true);
            
            // Scroll to form
            document.querySelector('.user-form-card').scrollIntoView({ behavior: 'smooth' });
            
            this.showMessage('Editing User', 'success');
            
        } catch (error) {
            console.error('Error loading user for editing:', error);
            this.showMessage('Error loading user data', 'error');
        }
    }

    /**
     * Set edit mode - toggle between add and edit UI states
     * @param {boolean} isEditMode - Whether to enable edit mode
     */
    setEditMode(isEditMode) {
        const addUserButton = document.getElementById('addUserButton');
        const saveChangesButton = document.getElementById('saveChangesButton');
        const cancelEditButton = document.getElementById('cancelEditButton');
        
        if (isEditMode) {
            // Hide Add User button, show Save Changes and Cancel buttons
            addUserButton.style.display = 'none';
            saveChangesButton.style.display = 'inline-block';
            cancelEditButton.style.display = 'inline-block';
            
            // Update form title or add indicator
            const formTitle = document.querySelector('.user-form-card h3');
            if (formTitle && !formTitle.textContent.includes('Edit')) {
                formTitle.innerHTML = '<i class="fas fa-user-edit"></i>Edit User';
            }
        } else {
            // Show Add User button, hide Save Changes and Cancel buttons
            addUserButton.style.display = 'inline-block';
            saveChangesButton.style.display = 'none';
            cancelEditButton.style.display = 'none';
            
            // Reset form title
            const formTitle = document.querySelector('.user-form-card h3');
            if (formTitle) {
                formTitle.innerHTML = '<i class="fas fa-user-plus"></i>Add New User';
            }
            
            // Clear editing user ID
            this.editingUserId = null;
            
            // Clear form
            this.addUserForm.reset();
            
            // Reset toggle text to default (Active)
            const toggleInput = document.getElementById('userActive');
            const toggleText = document.querySelector('.toggle-text');
            if (toggleInput && toggleText) {
                toggleInput.checked = true; // Default to active
                toggleText.textContent = 'Active';
            }
            
            // Generate new data for next user
            this.generatePassword();
            this.generateUsername();
        }
    }

    /**
     * Show message to user
     * @param {string} message - Message text
     * @param {string} type - Message type
     */
    showMessage(message, type) {
        const messageClass = type === 'success' ? 'success-message' : 'error-message';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
        
        this.messageContainer.innerHTML = `
            <div class="${messageClass}">
                <i class="fas ${icon}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.clearMessages();
            }, 5000);
        }
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        this.messageContainer.innerHTML = '';
    }

    /**
     * Set form loading state
     * @param {boolean} isLoading - Loading state
     */
    setFormLoadingState(isLoading) {
        const button = document.getElementById('addUserButton');
        const inputs = this.addUserForm.querySelectorAll('input, select, button');
        
        inputs.forEach(input => {
            input.disabled = isLoading;
        });
        
        if (isLoading) {
            button.innerHTML = `
                <div class="loading-spinner"></div>
                Adding User...
            `;
        } else {
            button.innerHTML = `
                <i class="fas fa-user-plus"></i>
                Add User
            `;
        }
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }
}

// Global variables for access from HTML onclick handlers
let userManagementSystem;
let userManagementUI;

/**
 * Application Initialization
 */
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize user management system first
        userManagementSystem = new UserManagementSystem();
        const initialized = await userManagementSystem.initialize();
        
        if (!initialized) {
            throw new Error('Failed to initialize User Management System');
        }

        // Check for admin access from session storage
         const adminEmail = sessionStorage.getItem('adminEmail');
         const currentUser = sessionStorage.getItem('currentUser');
         
         if (!adminEmail || !currentUser) {
             // Redirect to login if no valid session
             console.log('🔄 DEBUG: No valid session found, redirecting to login');
             window.location.href = '../login.html';
             return;
         }
         
         // Parse current user and check role
         const userData = JSON.parse(currentUser);
         if (userData.role !== 'administrator' && userData.role !== 'admin') {
             // Redirect moderators to dashboard
             console.log('🚫 DEBUG: Access denied - User is not an administrator');
             console.log('👤 DEBUG: User role:', userData.role);
             window.location.href = 'index.html';
             return;
         }
         
         console.log('✅ DEBUG: Valid administrator session found for:', adminEmail);
         
         // Set current admin from session
         userManagementSystem.setCurrentAdmin(adminEmail);

        // Initialize UI handler
        userManagementUI = new UserManagementUI(userManagementSystem);
        
        // Make userManagementUI globally accessible for onclick events
        window.userManagementUI = userManagementUI;
        
        // Logout functionality is now handled by the header component
        
        // Load initial data
        await userManagementUI.loadUsers();
        
        console.log('User Management System initialized successfully');
    } catch (error) {
        console.error('Failed to initialize User Management System:', error);
        
        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer) {
            messageContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Failed to initialize User Management System. Please refresh the page and try again.</span>
                </div>
            `;
        }
    }
});

// Export for potential use in other modules
export { UserManagementSystem, UserManagementUI };