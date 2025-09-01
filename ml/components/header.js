/**
 * Reusable Header Component for Character Management Dashboard
 * Provides consistent header functionality across all pages
 * Follows SOLID principles for maintainability and extensibility
 */

class DashboardHeader {
    constructor(options = {}) {
        this.pageTitle = options.pageTitle || 'Character Management System';
        this.userRole = options.userRole || 'Moderator';
        this.showSwitchAccount = options.showSwitchAccount !== false;
        this.headerElement = null;
        this.logoutModal = null;
        
        this.init();
    }

    /**
     * Initialize the header component
     * Creates header HTML and sets up event listeners
     */
    init() {
        this.createHeader();
        this.setupEventListeners();
        this.loadUserInfo();
    }

    /**
     * Create the header HTML structure
     * Maintains consistent styling and layout
     */
    createHeader() {
        const headerContainer = document.querySelector('.main-header');
        if (!headerContainer) {
            console.error('Header container not found');
            return;
        }

        const switchAccountButton = this.showSwitchAccount ? `
            <button class="header-logout-btn" id="headerLogoutBtn">
                <i class="fas fa-sign-out-alt"></i>
                Switch Account
            </button>
        ` : '';

        headerContainer.innerHTML = `
            <h1>${this.pageTitle}</h1>
            <div class="header-actions">
                <div class="header-info" id="headerUserInfo">Hello, User</div>
                ${switchAccountButton}
            </div>
        `;

        this.headerElement = headerContainer;
        
        // Create logout modal if switch account is enabled
        if (this.showSwitchAccount) {
            this.createLogoutModal();
        }
    }

    /**
     * Create logout confirmation modal
     */
    createLogoutModal() {
        const modalHTML = `
            <div class="modal" id="logoutModal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>
                            <i class="fas fa-sign-out-alt"></i>
                            Switch Account
                        </h3>
                        <button class="modal-close" id="closeLogoutModal" type="button">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to switch accounts? You will be logged out of the current session.</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" id="cancelLogout">Cancel</button>
                        <button class="btn btn-outline" id="confirmLogout">
                            <i class="fas fa-sign-out-alt"></i>
                            Switch Account
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.logoutModal = document.getElementById('logoutModal');
    }

    /**
     * Show logout confirmation modal
     */
    showLogoutModal() {
        if (this.logoutModal) {
            this.logoutModal.style.display = 'flex';
        }
    }

    /**
     * Hide logout confirmation modal
     */
    hideLogoutModal() {
        if (this.logoutModal) {
            this.logoutModal.style.display = 'none';
        }
    }

    /**
     * Handle user logout
     */
    handleLogout() {
        try {
            // Clear session storage
            sessionStorage.clear();
            
            // Hide modal
            this.hideLogoutModal();
            
            // Redirect to login page
            window.location.href = '../login.html';
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    /**
     * Set up event listeners for header interactions
     */
    setupEventListeners() {
        if (this.showSwitchAccount) {
            // Logout button event listener
            document.addEventListener('click', (e) => {
                if (e.target.id === 'headerLogoutBtn' || e.target.closest('#headerLogoutBtn')) {
                    this.showLogoutModal();
                }
            });

            // Modal event listeners
            document.addEventListener('click', (e) => {
                if (e.target.id === 'confirmLogout') {
                    this.handleLogout();
                } else if (e.target.id === 'cancelLogout' || 
                          e.target.id === 'closeLogoutModal' || 
                          e.target.closest('#closeLogoutModal') || 
                          (e.target.classList.contains('modal') && e.target.id === 'logoutModal')) {
                    this.hideLogoutModal();
                }
            });
        }
    }

    /**
     * Load and display user information
     * Extensible for future user data integration
     */
    async loadUserInfo() {
        try {
            // This can be extended to load actual user data from authentication service
            const userInfo = await this.getUserInfo();
            this.updateHeaderInfo(userInfo);
        } catch (error) {
            console.warn('Could not load user info:', error);
            // Fallback to default info
        }
    }

    /**
     * Get user information from authentication service
     * Fetches actual user data from Firestore and session storage
     */
    async getUserInfo() {
        try {
            // Get current user from session storage
            const currentUserData = sessionStorage.getItem('currentUser');
            const adminEmail = sessionStorage.getItem('adminEmail');
            const userRole = sessionStorage.getItem('userRole');
            
            if (currentUserData) {
                const user = JSON.parse(currentUserData);
                return {
                    role: user.role || userRole || this.userRole,
                    displayName: user.displayName || user.username || user.name || null,
                    email: user.email
                };
            } else if (adminEmail) {
                // Fallback to email if no full user data available
                return {
                    role: userRole || this.userRole,
                    displayName: adminEmail.split('@')[0], // Use email prefix as fallback
                    email: adminEmail
                };
            }
            
            // Default fallback
            return {
                role: userRole || this.userRole,
                displayName: null
            };
        } catch (error) {
            console.warn('Error getting user info:', error);
            return {
                role: sessionStorage.getItem('userRole') || this.userRole,
                displayName: null
            };
        }
    }

    /**
     * Update header information display
     * @param {Object} userInfo - User information object
     */
    updateHeaderInfo(userInfo) {
        const headerInfoElement = document.getElementById('headerUserInfo');
        if (headerInfoElement && userInfo) {
            let displayText;
            
            if (userInfo.displayName) {
                displayText = `Welcome, ${userInfo.displayName}`;
            } else if (userInfo.email) {
                // Extract username from email for display
                const username = this.extractUsernameFromEmail(userInfo.email);
                displayText = `Welcome, ${username}`;
            } else {
                displayText = 'Welcome, User';
            }
            
            // Add role information if available
            if (userInfo.role && userInfo.role !== 'user') {
                const roleDisplay = this.formatRole(userInfo.role);
                displayText += ` (${roleDisplay})`;
            }
            
            headerInfoElement.textContent = displayText;
        }
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
        
        const roleMap = {
            'administrator': 'Administrator',
            'moderator': 'Moderator',
            'user': 'User',
            'admin': 'Administrator'
        };
        
        return roleMap[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    }

    /**
     * Update page title dynamically
     * @param {string} newTitle - New page title
     */
    updatePageTitle(newTitle) {
        this.pageTitle = newTitle;
        const titleElement = this.headerElement?.querySelector('h1');
        if (titleElement) {
            titleElement.textContent = newTitle;
        }
    }

    /**
     * Update user role dynamically
     * @param {string} newRole - New user role
     */
    updateUserRole(newRole) {
        this.userRole = newRole;
        this.updateHeaderInfo({ role: newRole });
    }

    /**
     * Clean up the header component
     * Removes event listeners and DOM elements
     */
    destroy() {
        // Remove logout modal if it exists
        if (this.logoutModal) {
            this.logoutModal.remove();
        }
        
        // Clear references
        this.headerElement = null;
        this.logoutModal = null;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardHeader;
}

// Global availability for script tag usage
if (typeof window !== 'undefined') {
    window.DashboardHeader = DashboardHeader;
}