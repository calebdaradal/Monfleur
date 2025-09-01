/**
 * ML Access Control Utility
 * Provides functions to manage ML directory access restrictions
 * Can be used from outside the ML directory to control access
 */

/**
 * ML Access Control Manager
 * Handles the IsThisFirstTime_Log_From_LiveServer flag and related functionality
 */
class MLAccessControl {
    constructor() {
        this.flagKey = 'IsThisFirstTime_Log_From_LiveServer';
        console.log('🔧 ML Access Control initialized');
    }

    /**
     * Enable ML directory restriction
     * Prevents access to all pages in the ml/ directory
     */
    enableRestriction() {
        localStorage.setItem(this.flagKey, 'true');
        console.log('🔒 ML directory access restricted');
        return true;
    }

    /**
     * Disable ML directory restriction
     * Allows normal access to ml/ directory pages
     */
    disableRestriction() {
        localStorage.setItem(this.flagKey, 'false');
        console.log('🔓 ML directory access enabled');
        return true;
    }

    /**
     * Clear the restriction flag entirely
     * Removes the flag from localStorage
     */
    clearRestriction() {
        localStorage.removeItem(this.flagKey);
        console.log('🗑️ ML directory restriction flag cleared');
        return true;
    }

    /**
     * Check if ML directory is currently restricted
     * @returns {boolean} True if access is restricted
     */
    isRestricted() {
        const flagValue = localStorage.getItem(this.flagKey);
        return flagValue === 'true';
    }

    /**
     * Get the current flag value
     * @returns {string|null} Current flag value or null if not set
     */
    getFlagValue() {
        return localStorage.getItem(this.flagKey);
    }

    /**
     * Get detailed restriction status
     * @returns {Object} Comprehensive status information
     */
    getStatus() {
        const flagValue = this.getFlagValue();
        const isRestricted = this.isRestricted();
        
        return {
            flagValue,
            isRestricted,
            flagExists: flagValue !== null,
            timestamp: new Date().toISOString(),
            description: this.getStatusDescription(isRestricted, flagValue)
        };
    }

    /**
     * Get human-readable status description
     * @param {boolean} isRestricted - Whether access is restricted
     * @param {string|null} flagValue - Current flag value
     * @returns {string} Status description
     */
    getStatusDescription(isRestricted, flagValue) {
        if (flagValue === null) {
            return 'No restriction flag set - ML directory access is allowed';
        }
        
        if (isRestricted) {
            return 'ML directory access is RESTRICTED - Users will be redirected';
        }
        
        return 'ML directory access is ALLOWED - Users can navigate freely';
    }

    /**
     * Toggle restriction state
     * @returns {boolean} New restriction state
     */
    toggleRestriction() {
        const currentlyRestricted = this.isRestricted();
        
        if (currentlyRestricted) {
            this.disableRestriction();
            return false;
        } else {
            this.enableRestriction();
            return true;
        }
    }

    /**
     * Set restriction with custom value
     * @param {boolean} restrict - Whether to restrict access
     */
    setRestriction(restrict) {
        if (restrict) {
            this.enableRestriction();
        } else {
            this.disableRestriction();
        }
    }

    /**
     * Check if user can access ML directory
     * @returns {Object} Access check result
     */
    checkAccess() {
        const isRestricted = this.isRestricted();
        
        return {
            canAccess: !isRestricted,
            isRestricted,
            reason: isRestricted ? 'First-time setup restriction is active' : 'Access allowed',
            redirectTo: isRestricted ? '../index.html' : null
        };
    }

    /**
     * Create a restriction control panel HTML
     * @returns {string} HTML for control panel
     */
    createControlPanel() {
        const status = this.getStatus();
        
        return `
            <div class="ml-access-control-panel" style="
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 1.5rem;
                margin: 1rem 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <h3 style="margin-top: 0; color: #333;">🛡️ ML Directory Access Control</h3>
                
                <div style="background: white; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                    <p><strong>Status:</strong> <span style="
                        padding: 0.25rem 0.5rem;
                        border-radius: 3px;
                        background: ${status.isRestricted ? '#f8d7da' : '#d4edda'};
                        color: ${status.isRestricted ? '#721c24' : '#155724'};
                    ">${status.description}</span></p>
                    <p><strong>Flag Value:</strong> <code>${status.flagValue || 'null'}</code></p>
                    <p><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <div style="margin-top: 1rem;">
                    <button onclick="mlAccessControl.enableRestriction(); location.reload();" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 0.25rem;
                    ">🔒 Enable Restriction</button>
                    
                    <button onclick="mlAccessControl.disableRestriction(); location.reload();" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 0.25rem;
                    ">🔓 Disable Restriction</button>
                    
                    <button onclick="mlAccessControl.clearRestriction(); location.reload();" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 0.25rem;
                    ">🗑️ Clear Flag</button>
                    
                    <button onclick="location.reload();" style="
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 0.25rem;
                    ">🔄 Refresh</button>
                </div>
                
                <div style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
                    <p><strong>Usage:</strong></p>
                    <ul>
                        <li><strong>Enable:</strong> Blocks all access to ML directory pages</li>
                        <li><strong>Disable:</strong> Allows normal access to ML directory</li>
                        <li><strong>Clear:</strong> Removes the flag entirely (same as disable)</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Log current status to console
     */
    logStatus() {
        const status = this.getStatus();
        console.group('🛡️ ML Access Control Status');
        console.log('Flag Value:', status.flagValue);
        console.log('Is Restricted:', status.isRestricted);
        console.log('Description:', status.description);
        console.log('Timestamp:', status.timestamp);
        console.groupEnd();
    }
}

// Create global instance
const mlAccessControl = new MLAccessControl();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MLAccessControl, mlAccessControl };
}

// Global availability
if (typeof window !== 'undefined') {
    window.MLAccessControl = MLAccessControl;
    window.mlAccessControl = mlAccessControl;
}

// Auto-log status when script loads
console.log('🔧 ML Access Control utility loaded');
mlAccessControl.logStatus();