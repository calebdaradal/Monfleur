/**
 * Page Guard Module
 * Common initialization script for all ML pages
 * Enforces navigation restrictions based on IsThisFirstTime_Log_From_LiveServer flag
 */

/**
 * Page Guard Class
 * Lightweight guard for pages that don't need full dashboard functionality
 */
class PageGuard {
    constructor() {
        this.isInitialized = false;
        console.log('🛡️ Page Guard initialized');
    }

    /**
     * Initialize page protection
     * Should be called immediately on page load
     */
    async initialize() {
        try {
            console.log('🛡️ [DEBUG] === PAGE GUARD INITIALIZATION STARTED ===');
            console.log('🛡️ [DEBUG] Page:', document.title || 'Unknown');
            console.log('🛡️ [DEBUG] URL:', window.location.href);
            
            // Check for all access restrictions
            const accessCheck = this.checkAccessRestriction();
            
            console.log('🛡️ [DEBUG] Access check result:', accessCheck);
            
            if (accessCheck.shouldRestrict) {
                console.warn('⚠️ [DEBUG] Page access BLOCKED:', accessCheck.reason);
                console.warn('⚠️ [DEBUG] Restriction type:', accessCheck.type);
                this.handleRestriction(accessCheck);
                return false;
            }

            this.isInitialized = true;
            console.log('✅ [DEBUG] Page Guard initialized successfully - Access ALLOWED');
            console.log('🛡️ [DEBUG] === PAGE GUARD INITIALIZATION COMPLETED ===');
            return true;
        } catch (error) {
            console.error('❌ [DEBUG] Page Guard initialization FAILED:', error);
            console.error('❌ [DEBUG] Error stack:', error.stack);
            return false;
        }
    }

    /**
     * Check if the first-time restriction is active
     * @returns {boolean} True if access should be restricted
     */
    checkFirstTimeRestriction() {
        const isFirstTime = localStorage.getItem('IsThisFirstTime_Log_From_LiveServer');
        return isFirstTime === 'true';
    }

    /**
     * Check if maintenance mode is active via URL parameters
     * @returns {boolean} True if maintenance mode is active
     */
    checkMaintenanceMode() {
        console.log('🔍 [DEBUG] Checking maintenance mode status...');
        
        const urlParams = new URLSearchParams(window.location.search);
        const maintenanceParam = urlParams.get('maintenance');
        const storedMaintenance = localStorage.getItem('ml_maintenance_mode');
        
        console.log('🔍 [DEBUG] URL maintenance parameter:', maintenanceParam);
        console.log('🔍 [DEBUG] Stored maintenance status:', storedMaintenance);
        
        // Check for maintenance activation
        if (maintenanceParam === 'enable' || maintenanceParam === 'enabled' || maintenanceParam === 'on' || maintenanceParam === 'true') {
            localStorage.setItem('ml_maintenance_mode', 'true');
            console.log('🔧 [DEBUG] Maintenance mode ACTIVATED via URL parameter:', maintenanceParam);
            console.log('🔧 [DEBUG] localStorage updated: ml_maintenance_mode = true');
            return true;
        }
        
        // Check for maintenance deactivation
        if (maintenanceParam === 'disable' || maintenanceParam === 'off' || maintenanceParam === 'false') {
            localStorage.removeItem('ml_maintenance_mode');
            console.log('✅ [DEBUG] Maintenance mode DEACTIVATED via URL parameter:', maintenanceParam);
            console.log('✅ [DEBUG] localStorage cleared: ml_maintenance_mode removed');
            return false;
        }
        
        // Check stored maintenance mode status
        const isMaintenanceActive = storedMaintenance === 'true';
        console.log('🔍 [DEBUG] Final maintenance mode status:', isMaintenanceActive);
        
        if (isMaintenanceActive) {
            console.log('⚠️ [DEBUG] Page access will be BLOCKED due to maintenance mode');
        } else {
            console.log('✅ [DEBUG] Maintenance mode check passed - no restrictions');
        }
        
        return isMaintenanceActive;
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
     * Check if access should be restricted based on both flag and authentication
     * @returns {Object} Restriction check result
     */
    checkAccessRestriction() {
        console.log('🔍 [DEBUG] === ACCESS RESTRICTION CHECK STARTED ===');
        console.log('🔍 [DEBUG] Current URL:', window.location.href);
        
        const isMaintenanceMode = this.checkMaintenanceMode();
        const isFirstTimeRestricted = this.checkFirstTimeRestriction();
        const isAuthenticated = this.checkUserAuthentication();
        
        console.log('🔍 [DEBUG] Restriction check results:');
        console.log('🔍 [DEBUG] - Maintenance Mode:', isMaintenanceMode);
        console.log('🔍 [DEBUG] - First Time Restricted:', isFirstTimeRestricted);
        console.log('🔍 [DEBUG] - User Authenticated:', isAuthenticated);
        
        // If maintenance mode is active, always restrict access (highest priority)
        if (isMaintenanceMode) {
            console.log('🚫 [DEBUG] ACCESS DENIED: Maintenance mode is active (highest priority)');
            return {
                shouldRestrict: true,
                reason: 'System is currently under maintenance',
                type: 'MAINTENANCE_MODE'
            };
        }
        
        // If first-time flag is true, always restrict regardless of authentication
        if (isFirstTimeRestricted) {
            console.log('🚫 [DEBUG] ACCESS DENIED: First-time restriction is active');
            return {
                shouldRestrict: true,
                reason: 'First-time setup restriction is active',
                type: 'FIRST_TIME_RESTRICTION'
            };
        }
        
        // If no first-time restriction but user is not authenticated, restrict access
        if (!isAuthenticated) {
            console.log('🚫 [DEBUG] ACCESS DENIED: User authentication required');
            return {
                shouldRestrict: true,
                reason: 'User authentication required',
                type: 'AUTHENTICATION_REQUIRED'
            };
        }
        
        // Access allowed
        console.log('✅ [DEBUG] ACCESS GRANTED: All checks passed');
        console.log('🔍 [DEBUG] === ACCESS RESTRICTION CHECK COMPLETED ===');
        return {
            shouldRestrict: false,
            reason: 'Access granted',
            type: 'ACCESS_GRANTED'
        };
    }

    /**
     * Check if user has valid authentication session
     * @returns {boolean} True if user is authenticated
     */
    checkUserAuthentication() {
        // Check for user session data
        const adminEmail = sessionStorage.getItem('adminEmail');
        const currentUser = sessionStorage.getItem('currentUser');
        
        // User is authenticated if either adminEmail or currentUser exists
        return !!(adminEmail || currentUser);
    }

    /**
     * Check if access should be restricted based on all conditions
     * @returns {Object} Restriction check result
     */
    checkAccessRestriction() {
        console.log('🔍 [DEBUG] === ACCESS RESTRICTION CHECK STARTED ===');
        
        // Check maintenance mode first (highest priority)
        const isMaintenanceActive = this.checkMaintenanceMode();
        console.log('🔍 [DEBUG] Maintenance mode check result:', isMaintenanceActive);
        
        if (isMaintenanceActive) {
            console.log('🚫 [DEBUG] Access BLOCKED due to maintenance mode');
            return {
                shouldRestrict: true,
                reason: 'System is currently under maintenance',
                type: 'MAINTENANCE_MODE'
            };
        }
        
        // Check first-time restriction
        const isFirstTimeRestricted = this.checkFirstTimeRestriction();
        console.log('🔍 [DEBUG] First-time restriction check result:', isFirstTimeRestricted);
        
        if (isFirstTimeRestricted) {
            console.log('🚫 [DEBUG] Access BLOCKED due to first-time restriction');
            return {
                shouldRestrict: true,
                reason: 'First-time setup restriction is active',
                type: 'FIRST_TIME_RESTRICTION'
            };
        }
        
        // Check user authentication
        const isAuthenticated = this.checkUserAuthentication();
        console.log('🔍 [DEBUG] User authentication check result:', isAuthenticated);
        
        if (!isAuthenticated) {
            console.log('🚫 [DEBUG] Access BLOCKED due to authentication requirement');
            return {
                shouldRestrict: true,
                reason: 'User authentication required',
                type: 'AUTHENTICATION_REQUIRED'
            };
        }
        
        // Allow access if all checks pass
        console.log('✅ [DEBUG] All access checks passed - Access ALLOWED');
        console.log('🔍 [DEBUG] === ACCESS RESTRICTION CHECK COMPLETED ===');
        return {
            shouldRestrict: false,
            reason: 'Access allowed',
            type: 'ALLOWED'
        };
    }

    /**
     * Handle restriction by showing message and redirecting
     * @param {Object} accessCheck - Access check result with restriction details
     */
    handleRestriction(accessCheck) {
        console.log('🚫 [DEBUG] === HANDLING PAGE RESTRICTION ===');
        console.log('🚫 [DEBUG] Restriction type:', accessCheck.type);
        console.log('🚫 [DEBUG] Restriction reason:', accessCheck.reason);
        
        // Wait for DOM to be ready before manipulating elements
        const hidePageContent = () => {
            if (document.body) {
                document.body.style.display = 'none';
                console.log('🚫 [DEBUG] Main page content hidden');
            } else {
                console.log('🚫 [DEBUG] document.body not ready, waiting...');
                setTimeout(hidePageContent, 10);
                return;
            }
            
            // Show restriction message based on type
            this.showRestrictionMessage(accessCheck);
            console.log('🚫 [DEBUG] Restriction overlay displayed');
        };
        
        // Start hiding content immediately or when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hidePageContent);
        } else {
            hidePageContent();
        }
        
        // Determine redirect target based on restriction type
        const redirectTo = accessCheck.type === 'AUTHENTICATION_REQUIRED' 
            ? '../login.html' 
            : '../index.html';
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = redirectTo;
        }, 3000);
        
        console.log('🚫 [DEBUG] Redirect countdown started');
        console.log('🚫 [DEBUG] === RESTRICTION HANDLING COMPLETED ===');
    }

    /**
     * Show restriction message overlay
     * @param {Object} accessCheck - Access check result with restriction details
     */
    showRestrictionMessage(accessCheck) {
        // Determine message content based on restriction type
        let icon, title, message, buttonText, redirectUrl;
        
        if (accessCheck.type === 'MAINTENANCE_MODE') {
            icon = '🔧';
            title = 'Maintenance Mode';
            message = 'The ML directory is currently under maintenance. Please check back later or contact the administrator.';
            buttonText = 'Go to Main App';
            redirectUrl = '../index.html';
        } else if (accessCheck.type === 'AUTHENTICATION_REQUIRED') {
            icon = '🔐';
            title = 'Authentication Required';
            message = 'You must be logged in to access the ML directory. Please sign in to continue.';
            buttonText = 'Go to Login';
            redirectUrl = '../login.html';
        } else {
            icon = '🔒';
            title = 'Access Restricted';
            message = 'The ML directory is currently restricted due to first-time setup requirements.';
            buttonText = 'Go to Main App';
            redirectUrl = '../index.html';
        }
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'restriction-overlay';
        overlay.innerHTML = `
            <div class="restriction-modal">
                <div class="restriction-icon">${icon}</div>
                <h2>${title}</h2>
                <p>${message}</p>
                <p>You will be redirected in <span id="countdown">3</span> seconds.</p>
                <button onclick="window.location.href='${redirectUrl}'" class="redirect-btn">
                    ${buttonText}
                </button>
            </div>
        `;
        
        // Add styles
        const styles = `
            <style>
                #restriction-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .restriction-modal {
                    background: #fff;
                    padding: 2.5rem;
                    border-radius: 12px;
                    text-align: center;
                    max-width: 450px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    animation: slideIn 0.3s ease-out;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .restriction-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                
                .restriction-modal h2 {
                    color: #333;
                    margin-bottom: 1rem;
                    font-size: 1.5rem;
                }
                
                .restriction-modal p {
                    color: #666;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }
                
                .redirect-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 500;
                    transition: background-color 0.2s;
                    margin-top: 1rem;
                }
                
                .redirect-btn:hover {
                    background: #0056b3;
                }
                
                #countdown {
                    font-weight: bold;
                    color: #007bff;
                }
            </style>
        `;
        
        // Insert styles and overlay
        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.appendChild(overlay);
        
        // Start countdown
        this.startCountdown();
    }

    /**
     * Start countdown timer
     */
    startCountdown() {
        let seconds = 3;
        const countdownElement = document.getElementById('countdown');
        
        const timer = setInterval(() => {
            seconds--;
            if (countdownElement) {
                countdownElement.textContent = seconds;
            }
            
            if (seconds <= 0) {
                clearInterval(timer);
            }
        }, 1000);
    }

    /**
     * Check if page is currently restricted
     * @returns {boolean} Current restriction status
     */
    isRestricted() {
        return this.checkFirstTimeRestriction();
    }

    /**
     * Get restriction status details
     * @returns {Object} Detailed restriction information
     */
    getRestrictionStatus() {
        const flagValue = localStorage.getItem('IsThisFirstTime_Log_From_LiveServer');
        const isRestricted = flagValue === 'true';
        
        return {
            isRestricted,
            flagValue,
            currentPath: window.location.pathname,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Auto-initialize page guard when script loads
 * This ensures immediate protection without requiring manual initialization
 */
(async function autoInitialize() {
    // Only run if we're in the ML directory
    const currentPath = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    const isMLPath = currentPath.includes('/ml/') || currentPath.endsWith('/ml');
    
    if (isMLPath) {
        console.log('🔍 ML directory detected, initializing page guard...');
        
        // Wait for DOM to be ready before initializing
        const initializePageGuard = async () => {
            const pageGuard = new PageGuard();
            const initialized = await pageGuard.initialize();
            
            if (!initialized) {
                console.log('🚫 Page access blocked by guard');
            } else {
                console.log('✅ Page guard allows access');
            }
            
            // Make guard available globally for debugging
            window.pageGuard = pageGuard;
        };
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializePageGuard);
        } else {
            await initializePageGuard();
        }
    }
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageGuard;
}

// Global availability
if (typeof window !== 'undefined') {
    window.PageGuard = PageGuard;
}