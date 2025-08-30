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
            <div class="modal-overlay" id="logoutModal" style="display: none;">
                <div class="modal-content">
                    <h3>Switch Account</h3>
                    <p>Are you sure you want to switch accounts? You will be logged out of the current session.</p>
                    <div class="modal-actions">
                        <button class="btn btn-outline" id="cancelLogout">Cancel</button>
                        <button class="btn btn-danger" id="confirmLogout">Switch Account</button>
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
                } else if (e.target.id === 'cancelLogout' || e.target.classList.contains('modal-overlay')) {
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
     * Fetches actual user data from Firestore
     */
    async getUserInfo() {
        try {
            // Get current user from session storage
            const currentUserData = sessionStorage.getItem('currentUser');
            const adminEmail = sessionStorage.getItem('adminEmail');
            
            if (currentUserData) {
                const user = JSON.parse(currentUserData);
                return {
                    role: user.role || this.userRole,
                    displayName: user.displayName || user.username || user.name || null,
                    email: user.email
                };
            } else if (adminEmail) {
                // Fallback to email if no full user data available
                return {
                    role: this.userRole,
                    displayName: adminEmail.split('@')[0], // Use email prefix as fallback
                    email: adminEmail
                };
            }
            
            // Default fallback
            return {
                role: this.userRole,
                displayName: null
            };
        } catch (error) {
            console.warn('Error getting user info:', error);
            return {
                role: this.userRole,
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
            const displayText = userInfo.displayName 
                ? `Hello, ${userInfo.displayName}`
                : `Hello, User`;
            headerInfoElement.textContent = displayText;
        }
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