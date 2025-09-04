/**
 * Logging Page JavaScript
 * Handles real-time display of character activity logs from Firebase
 * Integrates with LoggingService for real-time updates
 */

import loggingService from './services/logging-service.js';
import AuthenticationService from './services/authentication-service.js';

// Create authentication service instance
const authenticationService = new AuthenticationService();

/**
 * Logging Page Manager
 * Manages the logging interface with real-time updates and filtering
 */
class LoggingPageManager {
    constructor() {
        this.logs = [];
        this.filteredLogs = [];
        this.realtimeUnsubscribe = null;
        this.isInitialized = false;
        
        console.log('📊 Logging Page Manager initialized');
    }

    /**
     * Initialize the logging page
     * @returns {Promise<boolean>} Initialization success status
     */
    async initialize() {
        try {
            // Initialize logging service
            const loggingInitialized = await loggingService.initialize();
            if (!loggingInitialized) {
                throw new Error('Failed to initialize logging service');
            }

            // Initialize authentication service
            const authInitialized = await authenticationService.initialize();
            if (!authInitialized) {
                console.warn('⚠️ Authentication service not initialized, continuing without user context');
            }

            // Setup event listeners
            this.setupEventListeners();

            // Setup real-time listener for logs
            await this.setupRealtimeUpdates();

            // Load initial logs
            await this.loadLogs();

            this.isInitialized = true;
            console.log('✅ Logging Page Manager initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Logging Page Manager:', error);
            this.showErrorMessage('Failed to initialize logging system');
            return false;
        }
    }

    /**
     * Setup event listeners for filters and controls
     */
    setupEventListeners() {
        // Type filter
        const typeFilter = document.getElementById('logTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.applyFilters());
        }

        // Date filter
        const dateFilter = document.getElementById('logDateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.applyFilters());
        }

        // Export button
        const exportBtn = document.querySelector('[onclick="exportLogs()"]');
        if (exportBtn) {
            exportBtn.removeAttribute('onclick');
            exportBtn.addEventListener('click', () => this.exportLogs());
        }
    }

    /**
     * Setup real-time listener for log updates
     */
    async setupRealtimeUpdates() {
        try {
            this.realtimeUnsubscribe = await loggingService.setupRealtimeListener(
                (logs) => {
                    this.logs = logs;
                    this.applyFilters();
                },
                { limit: 1000 } // Limit to last 1000 logs for performance
            );
            
            console.log('🔄 Real-time log updates enabled');
        } catch (error) {
            console.error('❌ Failed to setup real-time updates:', error);
        }
    }

    /**
     * Load logs from the logging service
     */
    async loadLogs() {
        try {
            this.showLoadingState(true);
            
            const logs = await loggingService.getLogs({ limit: 1000 });
            this.logs = logs;
            this.applyFilters();
            
        } catch (error) {
            console.error('❌ Failed to load logs:', error);
            this.showErrorMessage('Failed to load logs');
        } finally {
            this.showLoadingState(false);
        }
    }

    /**
     * Apply current filters to logs
     */
    applyFilters() {
        const typeFilter = document.getElementById('logTypeFilter')?.value || 'all';
        const dateFilter = document.getElementById('logDateFilter')?.value || 'all';

        // Apply filters using the logging service
        this.filteredLogs = loggingService.applyFilters(this.logs, {
            type: typeFilter,
            dateRange: dateFilter
        });

        this.renderLogs();
    }

    /**
     * Render logs in the table
     */
    renderLogs() {
        const tbody = document.getElementById('logsTableBody');
        if (!tbody) {
            console.error('❌ Logs table body not found');
            return;
        }

        if (this.filteredLogs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="no-logs">
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <p>No logs found</p>
                            <small>No activity logs match the current filters</small>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredLogs.map(log => {
            const formattedTimestamp = loggingService.formatTimestamp(log.timestamp);
            const typeClass = this.getTypeClass(log.type);
            
            return `
                <tr>
                    <td>${formattedTimestamp}</td>
                    <td><span class="log-type ${typeClass}">${log.type}</span></td>
                    <td>${this.escapeHtml(log.user || 'Unknown User')}</td>
                    <td>${this.escapeHtml(log.details || log.masterlistNumber || 'No details')}</td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Get CSS class for log type
     * @param {string} type - Log type
     * @returns {string} CSS class name
     */
    getTypeClass(type) {
        switch (type?.toUpperCase()) {
            case 'UPLOAD':
                return 'upload';
            case 'EDIT':
                return 'edit';
            case 'DELETE':
                return 'delete';
            default:
                return 'unknown';
        }
    }

    /**
     * Export logs to CSV
     */
    async exportLogs() {
        try {
            if (this.filteredLogs.length === 0) {
                this.showErrorMessage('No logs to export');
                return;
            }

            const csvContent = loggingService.exportToCSV(this.filteredLogs);
            
            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `character_logs_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                console.log('📁 Logs exported successfully');
            } else {
                throw new Error('Browser does not support file downloads');
            }
            
        } catch (error) {
            console.error('❌ Failed to export logs:', error);
            this.showErrorMessage('Failed to export logs');
        }
    }

    /**
     * Show loading state
     * @param {boolean} isLoading - Loading state
     */
    showLoadingState(isLoading) {
        const tbody = document.getElementById('logsTableBody');
        if (!tbody) return;

        if (isLoading) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading-state">
                        <div class="loading-spinner"></div>
                    </td>
                </tr>
            `;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showErrorMessage(message) {
        const tbody = document.getElementById('logsTableBody');
        if (!tbody) {
            console.error('❌', message);
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="error-state">
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error: ${this.escapeHtml(message)}</p>
                        <button onclick="window.location.reload()" class="btn btn-outline btn-sm">
                            <i class="fas fa-refresh"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.realtimeUnsubscribe) {
            this.realtimeUnsubscribe();
            this.realtimeUnsubscribe = null;
        }
        
        console.log('🧹 Logging Page Manager destroyed');
    }
}

// Global instance
let loggingPageManager = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing Logging Page...');
    
    try {
        loggingPageManager = new LoggingPageManager();
        const initialized = await loggingPageManager.initialize();
        
        if (!initialized) {
            console.error('❌ Failed to initialize logging page');
        }
        
    } catch (error) {
        console.error('❌ Error initializing logging page:', error);
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (loggingPageManager) {
        loggingPageManager.destroy();
    }
});

// Legacy function for backward compatibility
window.exportLogs = function() {
    if (loggingPageManager) {
        loggingPageManager.exportLogs();
    }
};