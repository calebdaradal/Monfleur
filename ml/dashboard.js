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
import LoggingService from './services/logging-service.js';

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
        this.loggingService = LoggingService;
        
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
                this.redirectToLogin();
                return false;
            }
            
            // Restore session and check authentication in one step
            const sessionRestored = this.authService.restoreSession();
            console.log('🔄 Session restoration result:', sessionRestored);
            
            // Immediate authentication check
            if (!this.authService.isAuthenticated()) {
                console.warn('⚠️ User not authenticated, redirecting to login');
                this.redirectToLogin();
                return false;
            }
            
            // Get authenticated user data
            this.currentUser = this.authService.getCurrentUser();
            this.userRole = this.authService.getCurrentUserRole();
            
            if (!this.currentUser) {
                console.error('❌ No user data available after authentication');
                this.redirectToLogin();
                return false;
            }
            
            console.log('👤 Authenticated user:', this.currentUser);
            console.log('🔑 User role:', this.userRole);
            
            // Find header element with retry mechanism
            await this.findHeaderElement();
            
            // Update user interface
            this.updateNavigationForRole();
            
            // Load and display user information using authentication service data
            this.updateHeaderInfo();
            
            // If header component exists, refresh its user info
            if (window.dashboardHeader && typeof window.dashboardHeader.loadUserInfo === 'function') {
                console.log('🔄 Refreshing header component user info...');
                await window.dashboardHeader.loadUserInfo();
            }
            
            // Update dashboard content based on role
            this.updateDashboardContent();
            
            // Load recent activities
            await this.loadRecentActivities();
            
            // Load and update character count
            await this.loadCharacterCount();
            
            console.log('✅ Dashboard initialization complete');
            return true;
        } catch (error) {
            console.error('❌ Error initializing dashboard:', error);
            return false;
        }
    }

    /**
     * Redirect to login page with proper cleanup
     */
    redirectToLogin() {
        console.log('🔄 Redirecting to login page...');
        // Clear any existing session data
        if (this.authService) {
            this.authService.logout();
        }
        window.location.href = '../login.html';
    }

    /**
     * Find header element with retry mechanism
     */
    async findHeaderElement() {
        const maxRetries = 10;
        const retryDelay = 100;
        
        for (let i = 0; i < maxRetries; i++) {
            this.headerInfoElement = document.querySelector('.header-info') || document.querySelector('#headerUserInfo');
            
            if (this.headerInfoElement) {
                console.log('✅ Header element found');
                return;
            }
            
            console.log(`⏳ Header element not found, retry ${i + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        
        console.warn('⚠️ Header info element not found after all retries');
    }

    /**
     * Load user information from authentication service
     * Updates the header with user details
     */
    loadUserInfo() {
        try {
            // Get current user from authentication service
            this.currentUser = this.authService.getCurrentUser();
            this.userRole = this.authService.getCurrentUserRole();
            
            console.log('🔍 Loading user info from auth service...', this.currentUser);
            
            if (this.currentUser) {
                console.log('👤 Current user loaded from auth service:', this.currentUser);
                // Update header with user information
                this.updateHeaderInfo();
            } else {
                // No user data found
                console.warn('⚠️ No authenticated user found');
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
        // Try to find header element if not already found
        if (!this.headerInfoElement) {
            this.headerInfoElement = document.querySelector('.header-info') || document.querySelector('#headerUserInfo');
        }
        
        if (!this.headerInfoElement) {
            console.warn('⚠️ Header info element not available for update - will retry later');
            // Retry after a short delay in case the header component is still loading
            setTimeout(() => {
                this.headerInfoElement = document.querySelector('.header-info') || document.querySelector('#headerUserInfo');
                if (this.headerInfoElement) {
                    console.log('✅ Header element found on retry, updating...');
                    this.updateHeaderInfo(fallbackText);
                }
            }, 500);
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
     * Delegates to the navigation component instead of directly manipulating DOM
     */
    updateNavigationForRole() {
        // Check if navigation component exists and update its role
        if (window.dashboardNavigation && typeof window.dashboardNavigation.updateUserRole === 'function') {
            console.log('🔄 Updating navigation component with role:', this.userRole);
            window.dashboardNavigation.updateUserRole(this.userRole);
        } else {
            console.warn('⚠️ Navigation component not available for role update');
        }
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

    /**
     * Load recent activities from actionlogs collection
     * Displays the 4 most recent activities in the dashboard
     */
    async loadRecentActivities() {
        try {
            console.log('📊 Loading recent activities...');
            console.log('🔍 LoggingService initialized:', this.loggingService.isInitialized);
            
            // Initialize logging service if not already done
            if (!this.loggingService.isInitialized) {
                console.log('🔧 Initializing LoggingService...');
                const initialized = await this.loggingService.initialize();
                console.log('🔧 LoggingService initialization result:', initialized);
                
                if (!initialized) {
                    console.error('❌ LoggingService initialization failed');
                    this.showActivityError();
                    return;
                }
            }
            
            console.log('📡 Fetching logs from database...');
            // Get the 4 most recent logs
            const recentLogs = await this.loggingService.getLogs({
                limit: 4,
                sortBy: 'timestamp',
                sortOrder: 'desc'
            });
            
            console.log('📋 Retrieved logs:', recentLogs);
            console.log('📋 Number of logs:', recentLogs ? recentLogs.length : 0);
            
            if (recentLogs && recentLogs.length > 0) {
                console.log('📋 Sample log structure:', recentLogs[0]);
            }
            
            // Update the activity list in the HTML
            console.log('🔄 Updating activity list...');
            this.updateActivityList(recentLogs);
            
            console.log('✅ Recent activities loaded successfully');
        } catch (error) {
            console.error('❌ Error loading recent activities:', error);
            console.error('❌ Error stack:', error.stack);
            this.showActivityError();
        }
    }

    /**
     * Update the activity list HTML with recent activities
     * @param {Array} activities - Array of recent activity logs
     */
    updateActivityList(activities) {
        console.log('🔄 updateActivityList called with:', activities);
        
        const activityList = document.querySelector('.activity-list');
        if (!activityList) {
            console.warn('⚠️ Activity list container not found');
            return;
        }
        
        console.log('✅ Activity list container found');
        
        if (!activities || activities.length === 0) {
            console.log('📋 No activities to display');
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-main">
                        <p class="activity-action">No recent activities</p>
                        <div class="activity-meta">
                            <span class="activity-user">System</span>
                        </div>
                    </div>
                    <span class="activity-time">-</span>
                </div>
            `;
            return;
        }
        
        console.log('📋 Processing', activities.length, 'activities');
        
        // Generate HTML for each activity
        const activitiesHTML = activities.map(activity => {
            // Handle both 'type' and 'actionType' field names for compatibility
            const actionType = activity.type || activity.actionType;
            const actionText = this.formatActivityAction(actionType, activity.masterlistNumber);
            const timeAgo = this.formatTimeAgo(activity.timestamp);
            // Handle both 'user' and 'username' field names for compatibility
            const userDisplay = activity.user || activity.username || 'Unknown User';
            
            return `
                <div class="activity-item">
                    <div class="activity-main">
                        <p class="activity-action">${actionText}</p>
                        <div class="activity-meta">
                            <span class="activity-user">by ${userDisplay}</span>
                            ${activity.masterlistNumber ? `<span class="activity-badge">${activity.masterlistNumber}</span>` : ''}
                        </div>
                    </div>
                    <span class="activity-time">${timeAgo}</span>
                </div>
            `;
        }).join('');
        
        console.log('🎨 Generated HTML:', activitiesHTML);
        activityList.innerHTML = activitiesHTML;
        console.log('✅ Activity list HTML updated successfully');
    }

    /**
     * Format activity action text based on action type
     * @param {string} actionType - Type of action (EDIT, UPLOAD, DELETE)
     * @param {string} masterlistNumber - Character masterlist number
     * @returns {string} Formatted action text
     */
    formatActivityAction(actionType, masterlistNumber) {
        const actionMap = {
            'UPLOAD': 'New character uploaded',
            'EDIT': 'Character updated',
            'DELETE': 'Character deleted',
            'APPROVE': 'Character approved',
            'REJECT': 'Character rejected'
        };
        
        return actionMap[actionType] || `${actionType} action performed`;
    }

    /**
     * Format timestamp to relative time (e.g., "2 minutes ago")
     * @param {number|string} timestamp - Timestamp to format
     * @returns {string} Formatted relative time
     */
    formatTimeAgo(timestamp) {
        try {
            const now = Date.now();
            const activityTime = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
            const diffMs = now - activityTime;
            
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffMinutes < 1) {
                return 'Just now';
            } else if (diffMinutes < 60) {
                return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
            } else if (diffHours < 24) {
                return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
            } else {
                return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
            }
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return 'Unknown time';
        }
    }

    /**
     * Load and update character count from Firebase
     */
    async loadCharacterCount() {
        try {
            console.log('📊 Loading character count...');
            
            // Import character service and repository
            const { FirebaseCharacterRepository } = await import('./repositories/character-repository.js');
            const CharacterService = (await import('./services/character-service.js')).default;
            const FirebaseConfig = (await import('./config/firebase-config.js')).default;
            
            // Initialize Firebase config if not already done
            if (!FirebaseConfig.isInitialized()) {
                await FirebaseConfig.initialize();
            }
            
            // Create repository and service instances
            const repository = new FirebaseCharacterRepository(FirebaseConfig);
            await repository.initialize();
            const characterService = new CharacterService(repository);
            
            // Get character count
            const count = await characterService.getCharacterCount();
            
            // Update the display
            this.updateCharacterCountDisplay(count);
            
            console.log(`📊 Character count updated: ${count}`);
        } catch (error) {
            console.error('❌ Error loading character count:', error);
            // Show fallback count or error state
            this.updateCharacterCountDisplay('Error');
        }
    }

    /**
     * Update character count display in the UI
     * @param {number|string} count - Character count or error message
     */
    updateCharacterCountDisplay(count) {
        const statValueElement = document.querySelector('.stat-value');
        if (statValueElement) {
            if (typeof count === 'number') {
                // Format number with commas for better readability
                statValueElement.textContent = count.toLocaleString();
            } else {
                statValueElement.textContent = count;
            }
        }
    }

    /**
     * Show error message when activities fail to load
     */
    showActivityError() {
        const activityList = document.querySelector('.activity-list');
        if (activityList) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-main">
                        <p class="activity-action">Failed to load recent activities</p>
                        <div class="activity-meta">
                            <span class="activity-user">System Error</span>
                        </div>
                    </div>
                    <span class="activity-time">-</span>
                </div>
            `;
        }
    }
}

// Initialize dashboard when DOM is loaded (only if not already initialized)
document.addEventListener('DOMContentLoaded', async function() {
    // Check if dashboard is already being initialized manually
    if (window.dashboardManager) {
        console.log('🔄 Dashboard already initialized, skipping DOMContentLoaded initialization');
        return;
    }
    
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