/**
 * Navigation Guard Service Module
 * Handles navigation restrictions based on various conditions
 * Follows SOLID principles for maintainability and extensibility
 */

import AuthenticationService from './authentication-service.js';

/**
 * Navigation Guard Class
 * Manages navigation restrictions and access control for the ml/ directory
 * Extends authentication service with additional conditional restrictions
 */
class NavigationGuard {
    constructor() {
        this.authService = new AuthenticationService();
        this.restrictedPaths = [];
        this.isInitialized = false;
        
        console.log('🛡️ Navigation Guard initialized');
    }

    /**
     * Initialize the navigation guard service
     * @returns {Promise<boolean>} Initialization success status
     */
    async initialize() {
        try {
            // Initialize authentication service
            const authInitialized = await this.authService.initialize();
            if (!authInitialized) {
                throw new Error('Authentication service initialization failed');
            }

            this.isInitialized = true;
            console.log('✅ Navigation Guard initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Navigation Guard initialization failed:', error);
            return false;
        }
    }

    /**
     * Check if navigation to ml/ directory should be restricted
     * @returns {boolean} True if navigation should be restricted
     */
    isMLDirectoryRestricted() {
        // Check for the IsThisFirstTime_Log_From_LiveServer flag
        const isFirstTime = localStorage.getItem('IsThisFirstTime_Log_From_LiveServer');
        
        // If the flag is true (string 'true'), restrict navigation
        return isFirstTime === 'true';
    }

    /**
     * Check if user is authenticated by validating session storage
     * @returns {boolean} True if user has valid session
     */
    checkUserAuthentication() {
        // Check for user session data
        const adminEmail = sessionStorage.getItem('adminEmail');
        const currentUser = sessionStorage.getItem('currentUser');
        
        // User is authenticated if either adminEmail or currentUser exists
        return !!(adminEmail || currentUser);
    }

    /**
     * Comprehensive access validation for ML directory
     * @returns {Object} Access validation result
     */
    validateMLAccess() {
        const isFirstTimeRestricted = this.isMLDirectoryRestricted();
        const isAuthenticated = this.checkUserAuthentication();
        
        // If first-time flag is true, always restrict regardless of authentication
        if (isFirstTimeRestricted) {
            return {
                hasAccess: false,
                reason: 'First-time setup restriction is active',
                type: 'FIRST_TIME_RESTRICTION',
                redirectTo: '../index.html'
            };
        }
        
        // If no first-time restriction but user is not authenticated, restrict access
        if (!isAuthenticated) {
            return {
                hasAccess: false,
                reason: 'User authentication required',
                type: 'AUTHENTICATION_REQUIRED',
                redirectTo: '../login.html'
            };
        }
        
        // Access allowed
        return {
            hasAccess: true,
            reason: 'Access granted',
            type: 'ACCESS_GRANTED',
            redirectTo: null
        };
    }

    /**
     * Validate access to a specific path with additional restrictions
     * @param {string} path - The path to validate access for
     * @param {string} requiredRole - Required user role (default: 'any')
     * @returns {Object} Access validation result
     */
    validateAccess(path = '', requiredRole = 'any') {
        try {
            if (!this.isInitialized) {
                throw new Error('Navigation guard not initialized');
            }

            // Check if the path is within the ml/ directory
            const isMLPath = this.isMLDirectoryPath(path);
            
            if (isMLPath) {
                // Perform comprehensive ML access validation
                const accessResult = this.validateMLAccess();
                
                if (!accessResult.hasAccess) {
                    return {
                        hasAccess: false,
                        redirectTo: accessResult.redirectTo,
                        reason: accessResult.reason,
                        restrictionType: accessResult.type
                    };
                }
            }

            // First, check standard authentication and role-based access
            const authValidation = this.authService.validateAccess(requiredRole);
            
            if (!authValidation.hasAccess) {
                return authValidation;
            }

            // If all checks pass, return the original auth validation
            return authValidation;
        } catch (error) {
            console.error('❌ Error validating access:', error);
            return {
                hasAccess: false,
                redirectTo: '../login.html',
                reason: 'Access validation error',
                error: error.message
            };
        }
    }

    /**
     * Check if a path is within the ml/ directory
     * @param {string} path - The path to check
     * @returns {boolean} True if path is within ml/ directory
     */
    isMLDirectoryPath(path) {
        if (!path) {
            // If no path provided, check current location
            path = window.location.pathname;
        }
        
        // Normalize path separators and check for ml/ directory
        const normalizedPath = path.replace(/\\/g, '/').toLowerCase();
        return normalizedPath.includes('/ml/') || normalizedPath.endsWith('/ml');
    }

    /**
     * Set the first-time restriction flag
     * @param {boolean} isRestricted - Whether to restrict access
     */
    setFirstTimeRestriction(isRestricted) {
        localStorage.setItem('IsThisFirstTime_Log_From_LiveServer', isRestricted.toString());
        console.log(`🔒 First-time restriction ${isRestricted ? 'enabled' : 'disabled'}`);
    }

    /**
     * Clear the first-time restriction flag
     */
    clearFirstTimeRestriction() {
        localStorage.removeItem('IsThisFirstTime_Log_From_LiveServer');
        console.log('🔓 First-time restriction cleared');
    }

    /**
     * Get the current restriction status
     * @returns {Object} Current restriction status and details
     */
    getRestrictionStatus() {
        const isRestricted = this.isMLDirectoryRestricted();
        const isMLPath = this.isMLDirectoryPath();
        
        return {
            isRestricted,
            isMLPath,
            shouldBlock: isRestricted && isMLPath,
            flagValue: localStorage.getItem('IsThisFirstTime_Log_From_LiveServer')
        };
    }

    /**
     * Initialize navigation protection for the current page
     * Should be called on page load to enforce restrictions
     */
    initializePageProtection(currentPath = window.location.pathname) {
        try {
            // Check if current path is in ML directory
            if (this.isMLDirectoryPath(currentPath)) {
                // Perform comprehensive ML access validation
                const accessResult = this.validateMLAccess();
                
                if (!accessResult.hasAccess) {
                    const title = accessResult.type === 'AUTHENTICATION_REQUIRED' 
                        ? 'Authentication Required' 
                        : 'ML Directory Access Restricted';
                    
                    const message = accessResult.type === 'AUTHENTICATION_REQUIRED'
                        ? 'You must be logged in to access the ML directory.'
                        : 'The ML directory is currently restricted due to first-time setup requirements.';
                    
                    this.showAccessDeniedMessage(title, message, accessResult.redirectTo);
                    return false;
                }
            }

            console.log('✅ Navigation Guard page protection initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Navigation Guard page protection failed:', error);
            return false;
        }
    }

    /**
     * Show access denied message with customizable content
     * @param {string} title - Message title
     * @param {string} message - Message content
     * @param {string} redirectTo - Redirect URL
     */
    showAccessDeniedMessage(title, message, redirectTo) {
        // Create and show a modal or notification
        const messageDiv = document.createElement('div');
        messageDiv.className = 'restriction-message';
        messageDiv.innerHTML = `
            <div class="restriction-content">
                <h3>🔒 ${title}</h3>
                <p>${message}</p>
                <p>You will be redirected shortly.</p>
                <button onclick="window.location.href='${redirectTo}'">Continue</button>
            </div>
        `;
        
        // Add styles
        messageDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
            font-family: Arial, sans-serif;
        `;
        
        const content = messageDiv.querySelector('.restriction-content');
        content.style.cssText = `
            background: #333;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            max-width: 400px;
        `;
        
        const button = messageDiv.querySelector('button');
        button.style.cssText = `
            background: #007bff;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 1rem;
        `;
        
        document.body.appendChild(messageDiv);
        
        // Auto-redirect after delay
        setTimeout(() => {
            window.location.href = redirectTo;
        }, 3000);
    }

    /**
     * Show a user-friendly restriction message
     */
    showRestrictionMessage() {
        // Create and show a modal or notification
        const messageDiv = document.createElement('div');
        messageDiv.className = 'restriction-message';
        messageDiv.innerHTML = `
            <div class="restriction-content">
                <h3>🔒 Access Restricted</h3>
                <p>The ML directory is currently restricted due to first-time setup requirements.</p>
                <p>You will be redirected to the main application shortly.</p>
                <button onclick="window.location.href='../index.html'">Go to Main App</button>
            </div>
        `;
        
        // Add styles
        messageDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
            font-family: Arial, sans-serif;
        `;
        
        const content = messageDiv.querySelector('.restriction-content');
        content.style.cssText = `
            background: #333;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            max-width: 400px;
        `;
        
        const button = messageDiv.querySelector('button');
        button.style.cssText = `
            background: #007bff;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 1rem;
        `;
        
        document.body.appendChild(messageDiv);
    }

    /**
     * Get the authentication service instance
     * @returns {AuthenticationService} Authentication service instance
     */
    getAuthService() {
        return this.authService;
    }
}

// Export for module usage
export default NavigationGuard;

// Global availability for script tag usage
if (typeof window !== 'undefined') {
    window.NavigationGuard = NavigationGuard;
}