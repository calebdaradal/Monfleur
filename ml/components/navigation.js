/**
 * Reusable Navigation Component for Character Management Dashboard
 * Provides role-based navigation functionality across all pages
 * Follows SOLID principles for maintainability and extensibility
 */

class DashboardNavigation {
    constructor(options = {}) {
        this.currentPage = options.currentPage || 'index.html';
        this.userRole = options.userRole || 'moderator';
        this.navigationElement = null;
        
        // State management for preventing concurrent updates
        this.isInitializing = false;
        this.isUpdating = false;
        this.initializationPromise = null;
        
        // Debouncing for rapid updates
        this.updateTimeout = null;
        this.DEBOUNCE_DELAY = 50; // milliseconds
        
        this.init();
    }

    /**
     * Initialize the navigation component
     * Ensures DOM readiness, loads user role, then creates navigation HTML
     * Prevents concurrent initialization attempts
     */
    async init() {
        // Prevent concurrent initialization
        if (this.isInitializing) {
            return this.initializationPromise;
        }
        
        this.isInitializing = true;
        
        try {
            this.initializationPromise = this.performInitialization();
            await this.initializationPromise;
        } finally {
            this.isInitializing = false;
            this.initializationPromise = null;
        }
    }
    
    /**
     * Perform the actual initialization sequence
     * Separated for better error handling and state management
     */
    async performInitialization() {
        // Ensure DOM is fully ready
        await this.waitForDOM();
        
        // Load user role first to prevent flash of incorrect content
        await this.loadUserRole();
        
        // Create navigation with proper state management
        this.createNavigation();
    }

    /**
     * Wait for DOM to be fully ready and sidebar container to be available
     * Prevents initialization errors and timing issues
     */
    async waitForDOM() {
        return new Promise((resolve) => {
            const checkDOM = () => {
                const sidebarNav = document.querySelector('.sidebar-nav');
                if (sidebarNav && document.readyState === 'complete') {
                    resolve();
                } else {
                    // Use requestAnimationFrame for better performance than setTimeout
                    requestAnimationFrame(checkDOM);
                }
            };
            checkDOM();
        });
    }

    /**
     * Load user role from session storage
     * Only loads role data without updating navigation to prevent flickering
     */
    async loadUserRole() {
        try {
            const currentUser = sessionStorage.getItem('currentUser');
            if (currentUser) {
                const userData = JSON.parse(currentUser);
                this.userRole = userData.role || 'moderator';
            }
        } catch (error) {
            console.warn('Could not load user role, using default:', error);
            // Keep default role set in constructor
        }
    }

    /**
     * Create the navigation HTML structure
     * Maintains consistent styling and layout with no visual artifacts
     * Enhanced with error handling and resilient loading conditions
     */
    createNavigation() {
        try {
            const sidebarNav = document.querySelector('.sidebar-nav');
            if (!sidebarNav) {
                console.warn('Sidebar navigation container not found, retrying...');
                // Retry after a brief delay if element not found
                setTimeout(() => this.createNavigation(), 50);
                return;
            }

            this.navigationElement = sidebarNav;
            
            // Prevent any visual flickering during initialization
            this.preventFlickering();
            
            // Add CSS styles for navigation states
            this.addNavigationStyles();
            
            // Apply role class to body before creating navigation
            this.applyRoleClass();
            
            // Create base navigation structure with role already determined
            this.createBaseNavigation();
            
            // Update active page highlighting
            this.updateActivePageHighlight();
            
            // Re-enable transitions after navigation is fully rendered
            this.enableTransitions();
            
        } catch (error) {
            console.error('Error creating navigation:', error);
            // Fallback: retry initialization after a delay
            setTimeout(() => this.createNavigation(), 100);
        }
    }

    /**
     * Prevent visual flickering during navigation initialization
     * Temporarily disables CSS transitions to ensure smooth rendering
     */
    preventFlickering() {
        // Check if anti-flicker styles already exist
        if (document.getElementById('navigation-anti-flicker')) {
            return;
        }

        const antiFlickerStyle = document.createElement('style');
        antiFlickerStyle.id = 'navigation-anti-flicker';
        antiFlickerStyle.textContent = `
            /* Temporarily disable transitions during initialization */
            .sidebar-nav * {
                transition: none !important;
                animation: none !important;
            }
        `;
        document.head.appendChild(antiFlickerStyle);
    }

    /**
     * Re-enable CSS transitions after navigation is fully rendered
     * Restores smooth hover and state change animations
     */
    enableTransitions() {
        // Use requestAnimationFrame to ensure DOM is fully updated
        requestAnimationFrame(() => {
            const antiFlickerStyle = document.getElementById('navigation-anti-flicker');
            if (antiFlickerStyle) {
                antiFlickerStyle.remove();
            }
        });
    }

    /**
     * Clean up resources and prevent memory leaks
     * Should be called when the navigation component is no longer needed
     */
    destroy() {
        // Clear any pending timeouts
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = null;
        }
        
        // Remove anti-flicker styles if they exist
        const antiFlickerStyle = document.getElementById('navigation-anti-flicker');
        if (antiFlickerStyle) {
            antiFlickerStyle.remove();
        }
        
        // Reset state
        this.isInitializing = false;
        this.isUpdating = false;
        this.initializationPromise = null;
        this.navigationElement = null;
        this.userRole = null;
    }

    /**
     * Add CSS styles for role-based navigation
     * Shows disabled state for restricted items instead of hiding them
     */
    addNavigationStyles() {
        // Check if styles already exist
        if (document.getElementById('navigation-role-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'navigation-role-styles';
        style.textContent = `
            /* Disabled state for restricted navigation items */
            .nav-item-disabled {
                opacity: 0.5;
                pointer-events: none;
                cursor: not-allowed;
            }
            
            .nav-item-disabled .nav-link {
                color: #6b7280 !important;
                cursor: not-allowed;
            }
            
            .nav-item-disabled .nav-link:hover {
                background-color: transparent !important;
                color: #6b7280 !important;
            }
            
            /* Ensure enabled navigation items have proper hover and active states */
            .nav-link:not(.nav-item-disabled .nav-link):hover,
            .nav-link:not(.nav-item-disabled .nav-link).active {
                background-color: var(--sidebar-accent) !important;
                color: var(--primary-foreground) !important;
            }
            
            /* Role-specific enabling */
            .user-role-administrator .nav-item-admin-only {
                opacity: 1;
                pointer-events: auto;
                cursor: pointer;
            }
            
            .user-role-administrator .nav-item-admin-only .nav-link {
                color: var(--foreground) !important;
                cursor: pointer;
            }
            
            .user-role-administrator .nav-item-admin-only .nav-link:hover,
            .user-role-administrator .nav-item-admin-only .nav-link.active {
                background-color: var(--sidebar-accent) !important;
                color: var(--primary-foreground) !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Create base navigation structure with role-specific CSS classes
     * Shows all items but disables restricted ones based on role
     * Uses atomic rendering to prevent visual artifacts
     */
    createBaseNavigation() {
        if (!this.navigationElement) return;

        // All navigation items with role requirements
        const allNavItems = [
            { href: 'index.html', icon: 'fas fa-home', text: 'Dashboard', roles: ['administrator', 'moderator'] },
            { href: 'upload.html', icon: 'fas fa-upload', text: 'Upload Character', roles: ['administrator', 'moderator'] },
            { href: 'database.html', icon: 'fas fa-database', text: 'Character Database', roles: ['administrator', 'moderator'] },
            { href: 'logging.html', icon: 'fas fa-file-text', text: 'Logging', roles: ['administrator', 'moderator'] },
            { href: 'user-management.html', icon: 'fas fa-users-cog', text: 'User Management', roles: ['administrator'] },
            { href: 'profile-settings.html', icon: 'fas fa-user-cog', text: 'Profile Settings', roles: ['administrator', 'moderator'] }
        ];

        // Create a document fragment for atomic DOM manipulation
        const fragment = document.createDocumentFragment();
        
        // Generate navigation items with proper state from the start
        allNavItems.forEach(item => {
            const isActive = item.href === this.currentPage;
            const isDisabled = !this.hasRoleAccess(item.roles);
            const disabledClass = isDisabled ? ' nav-item-disabled' : '';
            const adminOnlyClass = item.roles.includes('administrator') && !item.roles.includes('moderator') ? ' nav-item-admin-only' : '';
            
            // Create list item element
            const li = document.createElement('li');
            li.className = (disabledClass + adminOnlyClass).trim();
            
            // Create anchor element
            const a = document.createElement('a');
            a.href = isDisabled ? '#' : item.href;
            a.className = `nav-link${isActive ? ' active' : ''}`;
            if (isDisabled) {
                a.onclick = () => false;
            }
            
            // Create icon element
            const icon = document.createElement('i');
            icon.className = item.icon;
            
            // Assemble the navigation item
            a.appendChild(icon);
            a.appendChild(document.createTextNode(item.text));
            li.appendChild(a);
            fragment.appendChild(li);
        });

        // Clear existing content and append new navigation in one operation
        this.navigationElement.innerHTML = '';
        this.navigationElement.appendChild(fragment);
    }

    /**
     * Check if current user has access to specific roles
     * @param {Array} requiredRoles - Array of roles that have access
     * @returns {boolean} True if user has access
     */
    hasRoleAccess(requiredRoles) {
        const normalizedRole = this.userRole === 'admin' ? 'administrator' : this.userRole;
        return requiredRoles.includes(normalizedRole);
    }

    /**
     * Apply role class to body element
     * Separated from navigation update for better control
     */
    applyRoleClass() {
        // Remove existing role classes from body
        document.body.classList.remove('user-role-administrator', 'user-role-moderator', 'user-role-admin');
        
        // Add appropriate role class to body
        if (this.userRole === 'administrator' || this.userRole === 'admin') {
            document.body.classList.add('user-role-administrator');
        } else if (this.userRole === 'moderator') {
            document.body.classList.add('user-role-moderator');
        }
    }

    /**
     * Update navigation based on user role with debouncing
     * Prevents rapid successive updates that could cause flickering
     */
    updateNavigationForRole() {
        // Clear any pending updates
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        // Debounce the update to prevent rapid successive calls
        this.updateTimeout = setTimeout(() => {
            this.performNavigationUpdate();
        }, this.DEBOUNCE_DELAY);
    }
    
    /**
     * Perform the actual navigation update
     * Refreshes navigation with proper disabled states using atomic rendering
     * Prevents concurrent updates that could cause flickering
     */
    async performNavigationUpdate() {
        // Prevent concurrent updates
        if (this.isUpdating || this.isInitializing) {
            return;
        }
        
        if (!this.navigationElement) {
            console.warn('Navigation element not available for role update');
            return;
        }

        this.isUpdating = true;
        
        try {
            // Prevent flickering during role update
            this.preventFlickering();
            
            // Apply role class to body
            this.applyRoleClass();
            
            // Recreate navigation with updated role information
            this.createBaseNavigation();
            
            // Update active page highlighting
            this.updateActivePageHighlight();
            
            // Re-enable transitions after update is complete
            this.enableTransitions();
            
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Update active page highlighting in navigation
     */
    updateActivePageHighlight() {
        if (!this.navigationElement) return;
        
        // Remove active class from all nav links
        const navLinks = this.navigationElement.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Add active class to current page link
        const currentPageLink = this.navigationElement.querySelector(`a[href="${this.currentPage}"]`);
        if (currentPageLink) {
            currentPageLink.classList.add('active');
        }
    }

    /**
     * Update current page and refresh navigation
     * @param {string} newPage - New current page
     */
    updateCurrentPage(newPage) {
        this.currentPage = newPage;
        this.updateActivePageHighlight();
    }

    /**
     * Update user role and refresh navigation
     * @param {string} newRole - New user role
     */
    updateUserRole(newRole) {
        this.userRole = newRole;
        this.updateNavigationForRole();
    }

    /**
     * Get current user role
     * @returns {string} Current user role
     */
    getCurrentUserRole() {
        return this.userRole;
    }

    /**
     * Check if current user is administrator
     * @returns {boolean} True if administrator
     */
    isAdministrator() {
        return this.userRole === 'administrator' || this.userRole === 'admin';
    }

    /**
     * Check if current user is moderator
     * @returns {boolean} True if moderator
     */
    isModerator() {
        return this.userRole === 'moderator';
    }


}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardNavigation;
}

// Global availability for script tag usage
if (typeof window !== 'undefined') {
    window.DashboardNavigation = DashboardNavigation;
}