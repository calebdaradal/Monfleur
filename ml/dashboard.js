/**
 * Dashboard JavaScript Module
 * Handles dynamic content updates for the dashboard interface
 * 
 * Features:
 * - Dynamic header user information display
 * - Session management integration
 * - User authentication state handling
 * - Role-based access control using Firestore
 */

import AuthenticationService from './services/authentication-service.js';

/**
 * Dashboard Manager Class
 * Manages dashboard-specific functionality and UI updates
 */
class DashboardManager {
    constructor() {
        this.headerInfoElement = null;
        this.currentUser = null;
        this.userRole = null;
        this.authService = new AuthenticationService();
        
        console.log('🏠 Dashboard Manager initialized');
    }

    /**
     * Initialize the dashboard
     * Sets up event listeners and loads user data
     */
    async initialize() {
        try {
            console.log('🔧 Initializing dashboard...');
            
            // Initialize authentication service
            const authInitialized = await this.authService.initialize();
            if (!authInitialized) {
                console.error('❌ Authentication service initialization failed');
                window.location.href = '../login.html';
                return false;
            }
            
            // Validate access and restore session
            const accessValidation = this.authService.validateAccess('any');
            if (!accessValidation.hasAccess) {
                console.warn('⚠️', accessValidation.reason);
                window.location.href = accessValidation.redirectTo;
                return false;
            }
            
            // Set current user from authentication service
            this.currentUser = accessValidation.user;
            this.userRole = accessValidation.role;
            
            // Get DOM elements
            this.headerInfoElement = document.querySelector('.header-info');
            
            if (!this.headerInfoElement) {
                console.warn('⚠️ Header info element not found');
                return;
            }
            
            // Update navigation based on role
            this.updateNavigationForRole();
            
            // Load and display user information
            await this.loadUserInfo();
            
            // Update dashboard content based on role
            this.updateDashboardContent();
            
            console.log('✅ Dashboard initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Error initializing dashboard:', error);
            return false;
        }
    }

    /**
     * Load user information from session storage
     * Updates the header with user details
     */
    async loadUserInfo() {
        try {
            // Get user data from session storage
            const adminEmail = sessionStorage.getItem('adminEmail');
            const currentUserData = sessionStorage.getItem('currentUser');
            
            console.log('🔍 Loading user info...', { adminEmail, hasCurrentUser: !!currentUserData });
            
            if (currentUserData) {
                // Parse the current user data
                this.currentUser = JSON.parse(currentUserData);
                console.log('👤 Current user loaded:', this.currentUser);
                
                // Update header with user information
                this.updateHeaderInfo();
            } else if (adminEmail) {
                // Fallback to admin email if currentUser data is not available
                console.log('📧 Using admin email as fallback:', adminEmail);
                this.currentUser = { email: adminEmail, name: null };
                this.updateHeaderInfo();
            } else {
                // No user data found
                console.warn('⚠️ No user session data found');
                this.updateHeaderInfo('Guest User');
            }
        } catch (error) {
            console.error('❌ Error loading user info:', error);
            this.updateHeaderInfo('Unknown User');
        }
    }

    /**
     * Update the header info element with user information
     * @param {string} fallbackText - Fallback text if no user data available
     */
    updateHeaderInfo(fallbackText = null) {
        if (!this.headerInfoElement) {
            console.warn('⚠️ Header info element not available for update');
            return;
        }

        let displayText = fallbackText;
        
        if (this.currentUser && !fallbackText) {
            // Priority: name > email > role-based display
            if (this.currentUser.name && this.currentUser.name.trim()) {
                displayText = `Welcome, ${this.currentUser.name}`;
            } else if (this.currentUser.email) {
                // Extract username from email for display
                const username = this.extractUsernameFromEmail(this.currentUser.email);
                displayText = `Welcome, ${username}`;
            } else {
                displayText = 'Welcome, User';
            }
            
            // Add role information if available
            if (this.currentUser.role && this.currentUser.role !== 'user') {
                const roleDisplay = this.formatRole(this.currentUser.role);
                displayText += ` (${roleDisplay})`;
            }
        }
        
        // Fallback to default if still no display text
        if (!displayText) {
            displayText = 'Moderator Dashboard';
        }
        
        console.log('🏷️ Updating header info:', displayText);
        this.headerInfoElement.textContent = displayText;
    }

    /**
     * Extract username from email address
     * @param {string} email - Email address
     * @returns {string} Username portion of email
     */
    extractUsernameFromEmail(email) {
        if (!email || typeof email !== 'string') {
            return 'User';
        }
        
        const atIndex = email.indexOf('@');
        if (atIndex > 0) {
            return email.substring(0, atIndex);
        }
        
        return email;
    }

    /**
     * Format role for display
     * @param {string} role - User role
     * @returns {string} Formatted role
     */
    formatRole(role) {
        if (!role) return '';
        
        // Capitalize first letter and handle common roles
        const roleMap = {
            'admin': 'Administrator',
            'moderator': 'Moderator',
            'user': 'User',
            'editor': 'Editor'
        };
        
        return roleMap[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1);
    }

    /**
     * Refresh user information
     * Useful for updating display after user data changes
     */
    async refreshUserInfo() {
        console.log('🔄 Refreshing user information...');
        await this.loadUserInfo();
    }

    /**
     * Get current user data
     * @returns {Object|null} Current user object or null
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Set current user from authentication service
     * @param {Object} user - User object from authentication service
     */
    setCurrentUser(user) {
        if (user && this.authService.hasAdminPrivileges()) {
            this.currentUser = user;
            this.userRole = user.role;
            console.log(`${user.role.charAt(0).toUpperCase() + user.role.slice(1)} access granted for:`, user.email);
            return true;
        } else {
            console.warn('⚠️ Unauthorized user or invalid user object');
            window.location.href = '../login.html';
            return false;
        }
    }

    /**
     * Update navigation based on user role
     */
    updateNavigationForRole() {
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (!sidebarNav) return;

        // Base navigation items that both roles can access
        const baseNavItems = [
            { href: 'index.html', icon: 'fas fa-home', text: 'Dashboard', active: true },
            { href: 'upload.html', icon: 'fas fa-upload', text: 'Upload Character' },
            { href: 'database.html', icon: 'fas fa-database', text: 'Character Database' },
            { href: 'logging.html', icon: 'fas fa-file-text', text: 'Logging' }
        ];

        // Role-specific navigation items
        let roleSpecificItems = [];
        
        if (this.userRole === 'administrator') {
            // Administrators have access to user management
            roleSpecificItems = [
                { href: 'user-management.html', icon: 'fas fa-users-cog', text: 'User Management' }
            ];
        } else if (this.userRole === 'moderator') {
            // Moderators only have access to profile settings (user management disabled)
            roleSpecificItems = [
                { href: 'profile-settings.html', icon: 'fas fa-user-cog', text: 'Profile Settings' }
            ];
        }

        // Combine navigation items
        const allNavItems = [...baseNavItems, ...roleSpecificItems];

        // Generate navigation HTML
        const navHTML = allNavItems.map(item => `
            <li>
                <a href="${item.href}" class="nav-link${item.active ? ' active' : ''}">
                    <i class="${item.icon}"></i>${item.text}
                </a>
            </li>
        `).join('');

        sidebarNav.innerHTML = navHTML;
    }

    /**
     * Update dashboard content based on user role
     */
    updateDashboardContent() {
        // Update welcome section based on role
        this.updateWelcomeSection();
        
        // Update quick actions based on role
        this.updateQuickActions();
    }

    /**
     * Update welcome section based on user role
     */
    updateWelcomeSection() {
        const welcomeText = document.querySelector('.welcome-text');
        if (!welcomeText) return;

        const welcomeTitle = welcomeText.querySelector('h2');
        const welcomeDescription = welcomeText.querySelector('p');

        if (this.userRole === 'administrator') {
            welcomeTitle.textContent = 'Administrator Dashboard';
            welcomeDescription.textContent = 'Welcome to the Character Management System - Administrator Panel';
        } else if (this.userRole === 'moderator') {
            welcomeTitle.textContent = 'Moderator Dashboard';
            welcomeDescription.textContent = 'Welcome to the Character Management System - Moderator Panel';
        }
    }

    /**
     * Update quick actions based on user role
     */
    updateQuickActions() {
        const cardContent = document.querySelector('.card .card-content');
        if (!cardContent) return;

        // Base actions for all roles
        let actionsHTML = `
            <a href="upload.html" class="action-item">
                <div class="action-icon">
                    <i class="fas fa-upload"></i>
                </div>
                <div class="action-text">
                    <h4>Upload New Character</h4>
                    <p>Add a new character to the masterlist</p>
                </div>
            </a>
            <a href="database.html" class="action-item">
                <div class="action-icon">
                    <i class="fas fa-database"></i>
                </div>
                <div class="action-text">
                    <h4>Manage Characters</h4>
                    <p>View and edit existing characters</p>
                </div>
            </a>
        `;

        // Add role-specific actions
        if (this.userRole === 'administrator') {
            actionsHTML += `
                <a href="user-management.html" class="action-item">
                    <div class="action-icon">
                        <i class="fas fa-users-cog"></i>
                    </div>
                    <div class="action-text">
                        <h4>User Management</h4>
                        <p>Manage system users and permissions</p>
                    </div>
                </a>
            `;
        } else if (this.userRole === 'moderator') {
            actionsHTML += `
                <a href="profile-settings.html" class="action-item">
                    <div class="action-icon">
                        <i class="fas fa-user-cog"></i>
                    </div>
                    <div class="action-text">
                        <h4>Profile Settings</h4>
                        <p>Manage your profile and account settings</p>
                    </div>
                </a>
            `;
        }

        cardContent.innerHTML = actionsHTML;
    }

    /**
     * Setup logout functionality
     */


    /**
     * Get current user role
     * @returns {string|null} Current user role
     */
    getCurrentUserRole() {
        return this.authService.getCurrentUserRole();
    }

    /**
     * Check if current user is administrator
     * @returns {boolean} True if administrator
     */
    isAdministrator() {
        return this.authService.isAdministrator();
    }

    /**
     * Check if current user is moderator
     * @returns {boolean} True if moderator
     */
    isModerator() {
        return this.authService.isModerator();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Dashboard DOM loaded, initializing...');
    
    try {
        // Create and initialize dashboard manager
        const dashboardManager = new DashboardManager();
        await dashboardManager.initialize();
        
        // Make dashboard manager globally available for debugging
        window.dashboardManager = dashboardManager;
        
        console.log('✅ Dashboard setup complete');
    } catch (error) {
        console.error('❌ Error setting up dashboard:', error);
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardManager };
}

// Also make available globally
window.DashboardManager = DashboardManager;