/**
 * Profile Settings Management System
 * Handles moderator profile updates including display name, username, and password changes
 * 
 * @author MonFleur Development Team
 * @version 1.0.0
 * @since 2024
 */

import firebaseConfig from './config/firebase-config.js';
import AuthenticationService from './services/authentication-service.js';
import LoggingService from './services/logging-service.js';

/**
 * Profile Settings System Class
 * Manages profile updates for moderators
 */
class ProfileSettingsSystem {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.currentUser = null;
        this.firestoreFunctions = null;
        this.authService = new AuthenticationService();
    }

    /**
     * Initialize Firebase services
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            // Initialize authentication service first
            const authInitialized = await this.authService.initialize();
            if (!authInitialized) {
                throw new Error('Authentication service initialization failed');
            }

            // Import Firebase functions dynamically
            const { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            // Use the same Firebase app instance as AuthenticationService
            this.db = this.authService.db;
            
            // Store Firestore functions for later use
            this.firestoreFunctions = {
                doc, getDoc, updateDoc, collection, query, where, getDocs
            };

            this.isInitialized = true;
            console.log('✅ Profile Settings System initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Profile Settings System:', error);
            return false;
        }
    }

    /**
     * Set current user from session storage
     * @param {string} email - User email
     */
    setCurrentUser(email) {
        // Use AuthenticationService to get current user
        const currentUser = this.authService.getCurrentUser();
        
        if (currentUser && currentUser.email === email) {
            this.currentUser = {
                email: currentUser.email,
                displayName: currentUser.displayName || currentUser.username,
                username: currentUser.username,
                role: currentUser.role,
                uid: currentUser.uid
            };
            console.log('Profile loaded for:', email);
            return true;
        } else {
            console.warn('⚠️ User not authenticated or email mismatch:', email);
            return false;
        }
    }

    /**
     * Get current user profile data
     * @returns {Object|null} User profile data
     */
    getCurrentUserProfile() {
        return this.currentUser;
    }

    /**
     * Update user profile in Firestore
     * @param {Object} profileData - Profile data to update
     * @returns {Promise<boolean>} Success status
     */
    async updateProfile(profileData) {
        if (!this.isInitialized || !this.currentUser) {
            throw new Error('Profile Settings System not initialized or no user logged in');
        }

        try {
            const { collection, query, where, getDocs, updateDoc } = this.firestoreFunctions;
            
            // Find the user document in the 'users' collection
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('email', '==', this.currentUser.email));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                throw new Error('User not found in users collection');
            }
            
            const userDoc = querySnapshot.docs[0];
            
            const updateData = {
                ...profileData,
                updatedAt: new Date().toISOString()
            };
            
            // If password is being updated, store it as 'password' field
            if (profileData.passwordHash) {
                updateData.password = profileData.passwordHash;
                delete updateData.passwordHash; // Remove the temporary field
            }

            await updateDoc(userDoc.ref, updateData);
            
            // Update local user data
            this.currentUser = {
                ...this.currentUser,
                ...updateData
            };

            // Update session storage through authentication service
            this.authService.setCurrentUser(this.currentUser);

            console.log('✅ Profile updated successfully in users collection and session storage');
            return true;
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            throw error;
        }
    }

    /**
     * Load user profile from Firestore
     * @returns {Promise<Object>} User profile data
     */
    async loadProfile() {
        if (!this.isInitialized || !this.currentUser) {
            throw new Error('Profile Settings System not initialized or no user logged in');
        }

        try {
            const { collection, query, where, getDocs } = this.firestoreFunctions;
            
            // Get user data from 'users' collection (where passwords are stored)
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('email', '==', this.currentUser.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                
                // Update current user with data from users collection
                this.currentUser = {
                    ...this.currentUser,
                    ...userData,
                    uid: userDoc.id // Use document ID as uid
                };
                
                return this.currentUser;
            } else {
                console.warn('⚠️ User not found in users collection');
                return this.currentUser;
            }
        } catch (error) {
            console.error('❌ Error loading profile:', error);
            // Return default profile on error
            return this.currentUser;
        }
    }

    /**
     * Validate username format
     * @param {string} username - Username to validate
     * @returns {Object} Validation result
     */
    validateUsername(username) {
        const result = { isValid: false, message: '' };
        
        if (!username || username.trim().length === 0) {
            result.message = 'Username is required';
            return result;
        }

        const trimmedUsername = username.trim();
        
        // Check length (3-20 characters)
        if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
            result.message = 'Username must be between 3 and 20 characters';
            return result;
        }

        // Check format (alphanumeric, underscores, hyphens)
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(trimmedUsername)) {
            result.message = 'Username can only contain letters, numbers, underscores, and hyphens';
            return result;
        }

        // Check if starts with letter or number
        if (!/^[a-zA-Z0-9]/.test(trimmedUsername)) {
            result.message = 'Username must start with a letter or number';
            return result;
        }

        result.isValid = true;
        result.message = 'Username is valid';
        return result;
    }

    /**
     * Validate password
     * @param {string} password - Password to validate
     * @returns {Object} Validation result
     */
    validatePassword(password) {
        const result = { isValid: false, message: '' };
        
        if (!password || password.length === 0) {
            result.message = 'Password is required';
            return result;
        }

        if (password.length < 6) {
            result.message = 'Password must be at least 6 characters long';
            return result;
        }

        result.isValid = true;
        result.message = 'Password is valid';
        return result;
    }

    /**
     * Hash password using Web Crypto API
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Verify password against stored hash
     * @param {string} password - Plain text password
     * @param {string} storedHash - Stored password hash
     * @returns {Promise<boolean>} Verification result
     */
    async verifyPassword(password, storedHash) {
        try {
            // Check if stored hash has a prefix to identify hash type
            if (storedHash && storedHash.startsWith('sha256:')) {
                // Remove prefix and compare with our hash
                const hashWithoutPrefix = storedHash.substring(7); // Remove 'sha256:' prefix
                const hashedInput = await this.hashPassword(password);
                return hashedInput === hashWithoutPrefix;
            } else if (storedHash && storedHash.startsWith('base64:')) {
                // Handle base64 encoded passwords
                const base64Hash = btoa(password);
                return storedHash === 'base64:' + base64Hash;
            } else {
                // Legacy hash without prefix - try direct comparison
                const hashedInput = await this.hashPassword(password);
                return hashedInput === storedHash;
            }
        } catch (error) {
            console.error('❌ Password verification error:', error);
            return false;
        }
    }
}

/**
 * Profile Settings UI Class
 * Handles the user interface for profile settings
 */
class ProfileSettingsUI {
    constructor(profileSystem) {
        this.profileSystem = profileSystem;
        this.form = null;
        this.currentPasswordHash = null;
        this.initializeElements();
        this.setupEventListeners();
        this.setupUsernameGenerator();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.form = document.getElementById('profileSettingsForm');
        this.alertMessage = document.getElementById('alertMessage');
        
        // Current info elements
        this.currentEmail = document.getElementById('currentEmail');
        this.currentUsername = document.getElementById('currentUsername');
        this.currentRole = document.getElementById('currentRole');
        
        // Form inputs
        this.usernameInput = document.getElementById('username');
        this.currentPasswordInput = document.getElementById('currentPassword');
        this.newPasswordInput = document.getElementById('newPassword');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        
        // Feedback elements
        this.usernameFeedback = document.getElementById('usernameFeedback');
        this.currentPasswordFeedback = document.getElementById('currentPasswordFeedback');
        this.newPasswordFeedback = document.getElementById('newPasswordFeedback');
        this.confirmPasswordFeedback = document.getElementById('confirmPasswordFeedback');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        
        // Real-time validation
        this.usernameInput.addEventListener('input', this.validateUsername.bind(this));
        this.newPasswordInput.addEventListener('input', this.validateNewPassword.bind(this));
        this.confirmPasswordInput.addEventListener('input', this.validateConfirmPassword.bind(this));
        
        // Username generator
        document.getElementById('generateUsername').addEventListener('click', this.generateUsername.bind(this));
        document.getElementById('copyUsername').addEventListener('click', this.copyUsername.bind(this));
        
        // Password toggle functionality
        this.setupPasswordToggles();
        
        // Logout functionality is now handled by the header component
    }

    /**
     * Setup password toggle functionality
     */
    setupPasswordToggles() {
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
     * Setup username generator functionality
     */
    async setupUsernameGenerator() {
        try {
            this.adjectives = await this.loadWordList('../data/usernames/adjectives');
            this.animals = await this.loadWordList('../data/usernames/animals');
        } catch (error) {
            console.warn('Could not load username word lists:', error);
            // Fallback word lists
            this.adjectives = ['cool', 'swift', 'bright', 'clever', 'brave', 'quick', 'smart', 'bold'];
            this.animals = ['fox', 'wolf', 'eagle', 'lion', 'tiger', 'bear', 'hawk', 'deer'];
        }
    }

    /**
     * Load word list from file
     * @param {string} filePath - Path to word list file
     * @returns {Promise<Array>} Array of words
     */
    async loadWordList(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            return text.split('\n').map(word => word.trim()).filter(word => word.length > 0);
        } catch (error) {
            console.warn(`Could not load word list from ${filePath}:`, error);
            return [];
        }
    }

    /**
     * Generate a random username
     */
    async generateUsername() {
        try {
            const adjective = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
            const animal = this.animals[Math.floor(Math.random() * this.animals.length)];
            
            // Create concatenated username: AdjectiveAnimal (no underscore, no number)
            const username = `${adjective}${animal}`;
            this.usernameInput.value = username;
            
            // Validate the generated username
            this.validateUsername();
            
            this.showUsernameFeedback('Username generated successfully!', 'success');
        } catch (error) {
            console.error('Error generating username:', error);
            this.showUsernameFeedback('Failed to generate username', 'error');
        }
    }

    /**
     * Copy username to clipboard
     */
    async copyUsername() {
        try {
            const username = this.usernameInput.value;
            if (!username) {
                this.showUsernameFeedback('No username to copy', 'error');
                return;
            }
            
            await navigator.clipboard.writeText(username);
            this.showUsernameFeedback('Username copied to clipboard!', 'success');
        } catch (error) {
            console.error('Error copying username:', error);
            this.showUsernameFeedback('Failed to copy username', 'error');
        }
    }

    /**
     * Load and display current profile
     */
    async loadCurrentProfile() {
        try {
            // Get the most up-to-date profile from authentication service (session storage)
            const currentUser = this.profileSystem.authService.getCurrentUser();
            let profile;
            
            if (currentUser) {
                // Use session storage data if available (most recent)
                profile = currentUser;
            } else {
                // Fallback to database if session storage is not available
                profile = await this.profileSystem.loadProfile();
            }
            
            // Update current info display
            this.currentEmail.textContent = profile.email;
            this.currentUsername.textContent = profile.username || profile.email.split('@')[0];
            this.currentRole.textContent = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
            
            // Pre-fill form with current values
            this.usernameInput.value = profile.username || profile.email.split('@')[0];
            
            // Store current password hash if available
            // The passwordHash field in the database contains the hashed password
            this.currentPasswordHash = profile.passwordHash || profile.password || null;
            
            if (!this.currentPasswordHash) {
                console.warn('⚠️ No password hash found for user. Loading from database...');
                // Try to load the full profile from database to get password hash
                const fullProfile = await this.profileSystem.loadProfile();
                this.currentPasswordHash = fullProfile.passwordHash || fullProfile.password || null;
                
                if (!this.currentPasswordHash) {
                    console.error('❌ Unable to retrieve password hash from database');
                }
            }
            
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showAlert('Failed to load profile information', 'error');
        }
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        // Check if user is trying to change password or just username
        const newPassword = this.newPasswordInput.value.trim();
        const currentPassword = this.currentPasswordInput.value.trim();
        const confirmPassword = this.confirmPasswordInput.value.trim();
        const isPasswordChange = newPassword || currentPassword || confirmPassword;
        
        // Validate username (always required)
        const isUsernameValid = this.validateUsername();
        
        // Validate passwords only if user is trying to change password
        let isPasswordValid = true;
        if (isPasswordChange) {
            isPasswordValid = this.validatePasswords();
        } else {
            // Clear any existing password validation errors when not changing password
            this.hideCurrentPasswordFeedback();
            this.hideNewPasswordFeedback();
            this.hideConfirmPasswordFeedback();
        }
        
        if (!isUsernameValid || !isPasswordValid) {
            this.showAlert('Please fix the validation errors before saving', 'error');
            return;
        }
        
        try {
            this.setFormLoadingState(true);
            
            // Get current profile data for logging purposes
            const currentProfile = this.profileSystem.getCurrentUserProfile();
            const oldUsername = currentProfile ? currentProfile.username : 'Unknown';
            const newUsername = this.usernameInput.value.trim();
            const isUsernameChanged = oldUsername !== newUsername;
            
            const profileData = {
                username: newUsername
            };
            
            // Add password hash if password is being changed
            if (isPasswordChange && newPassword) {
                // Check if we have the current password hash
                if (!this.currentPasswordHash) {
                    this.showCurrentPasswordFeedback('Unable to verify current password. Please refresh the page and try again.', 'error');
                    this.setFormLoadingState(false);
                    return;
                }
                
                // Verify current password first
                const isCurrentPasswordValid = await this.profileSystem.verifyPassword(currentPassword, this.currentPasswordHash);
                
                if (!isCurrentPasswordValid) {
                    this.showCurrentPasswordFeedback('Current password is incorrect', 'error');
                    this.setFormLoadingState(false);
                    return;
                }
                
                profileData.passwordHash = await this.profileSystem.hashPassword(newPassword);
                this.currentPasswordHash = profileData.passwordHash;
            }
            
            await this.profileSystem.updateProfile(profileData);
            
            // Log username change if it occurred
            if (isUsernameChanged) {
                try {
                    await LoggingService.logUserActivity(
                        'USER_EDIT',
                        newUsername, // performed by
                        newUsername, // target user (same as performer for self-edit)
                        {
                            oldUsername: oldUsername,
                            newUsername: newUsername
                        }
                    );
                    console.log('✅ Username change logged successfully');
                } catch (logError) {
                    console.error('⚠️ Failed to log username change:', logError);
                    // Don't fail the entire operation if logging fails
                }
            }
            
            // Log password change if it occurred
            if (isPasswordChange && newUsername) {
                try {
                    await LoggingService.logUserActivity(
                        'PASSWORD_CHANGE',
                        newUsername, // performed by
                        newUsername, // target user (same as performer for self-edit)
                        {}
                    );
                    console.log('✅ Password change logged successfully');
                } catch (logError) {
                    console.error('⚠️ Failed to log password change:', logError);
                    // Don't fail the entire operation if logging fails
                }
            }
            
            if (isPasswordChange) {
                this.showAlert('Profile and password updated successfully!', 'success');
            } else {
                this.showAlert('Username updated successfully!', 'success');
            }
            
            // Clear password fields
            this.currentPasswordInput.value = '';
            this.newPasswordInput.value = '';
            this.confirmPasswordInput.value = '';
            
            // Reload current profile display
            await this.loadCurrentProfile();
            
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showAlert('Failed to update profile. Please try again.', 'error');
        } finally {
            this.setFormLoadingState(false);
        }
    }



    /**
     * Validate username
     */
    validateUsername() {
        const username = this.usernameInput.value.trim();
        const validation = this.profileSystem.validateUsername(username);
        
        if (validation.isValid) {
            this.showUsernameFeedback(validation.message, 'success');
        } else {
            this.showUsernameFeedback(validation.message, 'error');
        }
        
        return validation.isValid;
    }

    /**
     * Validate new password
     */
    validateNewPassword() {
        const password = this.newPasswordInput.value;
        
        if (!password) {
            this.hideNewPasswordFeedback();
            return true; // Password change is optional
        }
        
        const validation = this.profileSystem.validatePassword(password);
        
        if (validation.isValid) {
            this.showNewPasswordFeedback(validation.message, 'success');
        } else {
            this.showNewPasswordFeedback(validation.message, 'error');
        }
        
        // Also validate confirm password if it has a value
        if (this.confirmPasswordInput.value) {
            this.validateConfirmPassword();
        }
        
        return validation.isValid;
    }

    /**
     * Validate confirm password
     */
    validateConfirmPassword() {
        const newPassword = this.newPasswordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        
        if (!confirmPassword) {
            this.hideConfirmPasswordFeedback();
            return true;
        }
        
        if (newPassword !== confirmPassword) {
            this.showConfirmPasswordFeedback('Passwords do not match', 'error');
            return false;
        }
        
        this.showConfirmPasswordFeedback('Passwords match', 'success');
        return true;
    }

    /**
     * Validate all password fields
     */
    /**
     * Validate current password
     */
    validateCurrentPassword() {
        const currentPassword = this.currentPasswordInput.value;
        const newPassword = this.newPasswordInput.value;
        
        // Only validate if user is trying to change password
        if (!newPassword) {
            this.hideCurrentPasswordFeedback();
            return true;
        }
        
        if (!currentPassword) {
            this.showCurrentPasswordFeedback('Current password is required to change password', 'error');
            return false;
        }
        
        if (!this.currentPasswordHash) {
            this.showCurrentPasswordFeedback('Unable to verify password. Please refresh the page.', 'error');
            return false;
        }
        
        this.hideCurrentPasswordFeedback();
        return true;
    }

    validatePasswords() {
        const newPassword = this.newPasswordInput.value;
        
        // If no new password, validation passes
        if (!newPassword) {
            return true;
        }
        
        const isCurrentPasswordValid = this.validateCurrentPassword();
        const isNewPasswordValid = this.validateNewPassword();
        const isConfirmPasswordValid = this.validateConfirmPassword();
        
        return isCurrentPasswordValid && isNewPasswordValid && isConfirmPasswordValid;
    }

    /**
     * Show feedback for username
     */
    showUsernameFeedback(message, type) {
        this.usernameFeedback.textContent = message;
        this.usernameFeedback.className = `feedback ${type}`;
        this.usernameFeedback.style.display = 'block';
    }

    /**
     * Show feedback for current password
     */
    showCurrentPasswordFeedback(message, type) {
        this.currentPasswordFeedback.textContent = message;
        this.currentPasswordFeedback.className = `feedback ${type}`;
        this.currentPasswordFeedback.style.display = 'block';
    }

    /**
     * Hide current password feedback
     */
    hideCurrentPasswordFeedback() {
        this.currentPasswordFeedback.style.display = 'none';
    }

    /**
     * Show feedback for new password
     */
    showNewPasswordFeedback(message, type) {
        this.newPasswordFeedback.textContent = message;
        this.newPasswordFeedback.className = `feedback ${type}`;
        this.newPasswordFeedback.style.display = 'block';
    }

    /**
     * Hide new password feedback
     */
    hideNewPasswordFeedback() {
        this.newPasswordFeedback.style.display = 'none';
    }

    /**
     * Show feedback for confirm password
     */
    showConfirmPasswordFeedback(message, type) {
        this.confirmPasswordFeedback.textContent = message;
        this.confirmPasswordFeedback.className = `feedback ${type}`;
        this.confirmPasswordFeedback.style.display = 'block';
    }

    /**
     * Hide confirm password feedback
     */
    hideConfirmPasswordFeedback() {
        this.confirmPasswordFeedback.style.display = 'none';
    }

    /**
     * Show alert message
     */
    showAlert(message, type) {
        this.alertMessage.textContent = message;
        this.alertMessage.className = `alert ${type}`;
        this.alertMessage.style.display = 'block';
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.alertMessage.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Set form loading state
     */
    setFormLoadingState(isLoading) {
        const submitButton = document.getElementById('saveProfileButton');
        const inputs = this.form.querySelectorAll('input, button');
        
        if (isLoading) {
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            inputs.forEach(input => input.disabled = true);
        } else {
            submitButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            inputs.forEach(input => input.disabled = false);
        }
    }
}

// Initialize the system when DOM is loaded
let profileSettingsSystem;
let profileSettingsUI;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if user is logged in
        const adminEmail = sessionStorage.getItem('adminEmail');
        if (!adminEmail) {
            window.location.href = '../login.html';
            return;
        }

        // Initialize profile settings system
        profileSettingsSystem = new ProfileSettingsSystem();
        const initialized = await profileSettingsSystem.initialize();
        
        if (!initialized) {
            document.body.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; gap: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f59e0b;"></i>
                    <h2>System Initialization Failed</h2>
                    <p>Failed to initialize Profile Settings System. Please refresh the page and try again.</p>
                </div>
            `;
            return;
        }

        // Restore authentication session
        const sessionRestored = profileSettingsSystem.authService.restoreSession();
        console.log('🔧 Session restoration result:', sessionRestored);
        
        // Set current user
        const userSet = profileSettingsSystem.setCurrentUser(adminEmail);
        console.log('🔧 Set current user result:', userSet);
        
        if (!userSet) {
            console.warn('⚠️ User authentication failed - this might be normal for moderators');
            // Don't redirect immediately, let's see what happens
        }

        // Initialize UI
        profileSettingsUI = new ProfileSettingsUI(profileSettingsSystem);
        
        // Load current profile
        await profileSettingsUI.loadCurrentProfile();
        
        console.log('✅ Profile Settings System ready');
        
    } catch (error) {
        console.error('❌ Failed to initialize Profile Settings:', error);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        let errorMessage = 'Failed to initialize Profile Settings System.';
        if (error.message.includes('import statement')) {
            errorMessage = 'Module import error detected. This might be due to incorrect script type or CORS issues.';
        } else if (error.message.includes('Firebase')) {
            errorMessage = 'Firebase configuration error. Please check your Firebase setup.';
        }
        
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; gap: 20px; padding: 20px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc2626;"></i>
                <h2>Initialization Error</h2>
                <p>${errorMessage}</p>
                <details style="margin-top: 20px; text-align: left; max-width: 600px;">
                    <summary style="cursor: pointer; font-weight: bold;">Technical Details</summary>
                    <pre style="background: #f3f4f6; padding: 10px; border-radius: 5px; overflow: auto; margin-top: 10px;">${error.name}: ${error.message}</pre>
                </details>
                <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">Retry</button>
                <button onclick="window.location.href='../login.html'" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">Back to Login</button>
            </div>
        `;
    }
});

export { ProfileSettingsSystem, ProfileSettingsUI };