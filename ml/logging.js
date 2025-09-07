/**
 * Logging Page JavaScript
 * Handles real-time display of character activity logs from Firebase
 * Integrates with LoggingService for real-time updates
 */

import loggingService from './services/logging-service.js';
import AuthenticationService from './services/authentication-service.js';
import firebaseConfig from './config/firebase-config.js';

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
        this.userCache = new Map(); // Cache for user email lookups
        this.db = null;
        this.firestoreFunctions = null;
        
        // Pagination properties
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        
        console.log('📊 Logging Page Manager initialized');
    }

    /**
     * Initialize the logging page
     * @returns {Promise<boolean>} Initialization success status
     */
    async initialize() {
        try {
            // Initialize Firebase for user lookups
            await this.initializeFirebase();

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
        
        // Set up toggle button listeners
        this.setupToggleButtonListeners();
    }
    
    /**
     * Setup event listeners for toggle filter buttons
     */
    setupToggleButtonListeners() {
        const toggleButtons = document.querySelectorAll('.log-type-toggle');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                button.classList.toggle('active');
                
                // If no buttons are active, reactivate all (acts as "All" functionality)
                const activeButtons = document.querySelectorAll('.log-type-toggle.active');
                if (activeButtons.length === 0) {
                    toggleButtons.forEach(btn => btn.classList.add('active'));
                }
                
                this.applyFilters();
            });
        });
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
        const dateFilter = document.getElementById('logDateFilter')?.value || 'all';
        
        // Get active log types from toggle buttons
        const activeToggleButtons = document.querySelectorAll('.log-type-toggle.active');
        const activeTypes = Array.from(activeToggleButtons).map(button => button.dataset.type);
        
        // Start with all logs
        let filteredLogs = [...this.logs];
        
        // Apply type filter if specific types are selected
        if (activeTypes.length > 0 && activeTypes.length < document.querySelectorAll('.log-type-toggle').length) {
            filteredLogs = filteredLogs.filter(log => 
                activeTypes.includes(log.type)
            );
        }
        
        // Apply date filter using the logging service
        this.filteredLogs = loggingService.applyFilters(filteredLogs, {
            dateRange: dateFilter
        });

        // Reset to first page when filters change
        this.currentPage = 1;
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
            this.updatePaginationInfo();
            return;
        }

        // Calculate pagination
        this.totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedLogs = this.filteredLogs.slice(startIndex, endIndex);

        tbody.innerHTML = paginatedLogs.map((log, index) => {
            const formattedTimestamp = loggingService.formatTimestamp(log.timestamp);
            const typeClass = this.getTypeClass(log.type);
            const detailsContent = this.formatLogDetails(log, startIndex + index);
            const userCell = this.renderUserCell(log.user || 'Unknown User');
            
            return `
                <tr>
                    <td>${formattedTimestamp}</td>
                    <td><span class="log-type ${typeClass}">${log.type}</span></td>
                    <td>${userCell}</td>
                    <td>${detailsContent}</td>
                </tr>
            `;
        }).join('');
        
        // Update pagination controls
        this.updatePaginationInfo();
        this.renderPaginationControls();
        
        // Setup hover event listeners for administrator users
        if (authenticationService.isAdministrator()) {
            this.setupUserHoverEvents();
        }
    }

    /**
     * Render user cell with hover functionality for administrators
     * @param {string} username - Username to display
     * @returns {string} HTML for user cell
     */
    renderUserCell(username) {
        const escapedUsername = this.escapeHtml(username);
        
        // If current user is administrator, add hover functionality
        if (authenticationService.isAdministrator()) {
            return `<span class="hoverable-username" data-username="${escapedUsername}">${escapedUsername}<span class="email-tooltip"></span></span>`;
        }
        
        // Regular display for non-administrators
        return escapedUsername;
    }

    /**
     * Setup hover event listeners for username tooltips
     */
    setupUserHoverEvents() {
        const hoverableUsernames = document.querySelectorAll('.hoverable-username');
        
        hoverableUsernames.forEach(element => {
            const username = element.dataset.username;
            const tooltip = element.querySelector('.email-tooltip');
            
            element.addEventListener('mouseenter', async () => {
                // Show loading state
                tooltip.textContent = 'Loading...';
                tooltip.classList.add('visible');
                
                // Fetch user email
                const email = await this.getUserEmailByUsername(username);
                
                // Update tooltip content
                if (email) {
                    tooltip.textContent = email;
                } else {
                    tooltip.textContent = 'Email not found';
                }
            });
            
            element.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
            });
        });
    }

    /**
     * Format log details based on log type and changes
     * @param {Object} log - Log entry
     * @param {number} index - Log index for unique IDs
     * @returns {string} Formatted details HTML
     */
    formatLogDetails(log, index) {
        const masterlistNumber = log.masterlistNumber || 'Unknown';
        
        // For non-edit logs, show simple format
        if (log.type !== 'EDIT' || !log.changes || !Array.isArray(log.changes)) {
            return this.escapeHtml(log.details || masterlistNumber);
        }
        
        // For edit logs with changes
        if (log.changes.length === 0) {
            return this.escapeHtml(masterlistNumber);
        } else if (log.changes.length === 1) {
            // Single change - show inline with color formatting
            const change = log.changes[0];
            return `${this.escapeHtml(masterlistNumber)} ${this.formatSingleChange(change)}`;
        } else {
            // Multiple changes - show button
            return `
                ${this.escapeHtml(masterlistNumber)} 
                <button class="btn btn-sm btn-outline multiple-edits-btn" 
                        onclick="loggingPageManager.showMultipleEditsModal(${index})">
                    <i class="fas fa-list"></i> Multiple edits (${log.changes.length})
                </button>
            `;
        }
    }

    /**
     * Show modal with multiple edits details
     * @param {number} logIndex - Index of the log entry
     */
    showMultipleEditsModal(logIndex) {
        const log = this.filteredLogs[logIndex];
        if (!log || !log.changes || log.changes.length === 0) {
            return;
        }
        
        const modal = this.getOrCreateMultipleEditsModal();
        const modalBody = modal.querySelector('.modal-body');
        const modalTitle = modal.querySelector('.modal-title');
        
        modalTitle.textContent = `Character Edits - ${log.masterlistNumber || 'Unknown'}`;
        
        modalBody.innerHTML = `
            <div class="changes-list">
                ${log.changes.map(change => `
                    <div class="change-item">
                        <i class="fas fa-arrow-right change-icon"></i>
                        <span class="change-text">${this.formatSingleChange(change)}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        modal.style.display = 'block';
    }
    
    /**
     * Get or create the multiple edits modal
     * @returns {HTMLElement} Modal element
     */
    getOrCreateMultipleEditsModal() {
        let modal = document.getElementById('multipleEditsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'multipleEditsModal';
            modal.className = 'modal';
            modal.style.display = 'none'; // Initially hidden
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">Character Edits</h3>
                        <button class="modal-close" onclick="loggingPageManager.closeMultipleEditsModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <!-- Changes will be populated here -->
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeMultipleEditsModal();
                }
            });
        }
        return modal;
    }
    
    /**
     * Close the multiple edits modal
     */
    closeMultipleEditsModal() {
        const modal = document.getElementById('multipleEditsModal');
        if (modal) {
            modal.style.display = 'none';
        }
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
            case 'USER_EDIT':
                return 'user_edit';
            case 'ADMIN_EDIT':
                return 'admin_edit';
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
     * Format a single change object for display
     * @param {Object} change - Change object with displayName, from, to properties
     * @returns {string} HTML formatted change text
     */
    formatSingleChange(change) {
        // If change has structured data, use it for better formatting
        if (change && typeof change === 'object') {
            const displayName = change.displayName || change.field || 'Field';
            const fromValue = change.from || change.oldValue || '(empty)';
            const toValue = change.to || change.newValue || '(empty)';
            
            return `<strong>${this.escapeHtml(displayName)}:</strong> <span class="change-old-value">${this.escapeHtml(fromValue)}</span> &rarr; <span class="change-new-value">${this.escapeHtml(toValue)}</span>`;
        }
        
        // Fallback to changeText if available
        if (change && change.changeText) {
            return this.formatChangeTextWithColors(change.changeText);
        }
        
        // Last resort - treat as string
        return this.escapeHtml(String(change));
    }

    /**
     * Format change text with color coding for old (red) and new (green) values
     * @param {string} changeText - The change text to format
     * @returns {string} HTML formatted change text
     */
    formatChangeTextWithColors(changeText) {
        // Pattern to match "Field: OldValue --> NewValue" format
        const changePattern = /^(.+?):\s*(.+?)\s*-->\s*(.+)$/;
        const match = changeText.match(changePattern);
        
        if (match) {
            const [, field, oldValue, newValue] = match;
            return `<strong>${this.escapeHtml(field)}:</strong> <span class="change-old-value">${this.escapeHtml(oldValue.trim())}</span> &rarr; <span class="change-new-value">${this.escapeHtml(newValue.trim())}</span>`;
        }
        
        // Fallback for non-standard format
        return this.escapeHtml(changeText);
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
     * Update pagination information display
     */
    updatePaginationInfo() {
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            const startItem = this.filteredLogs.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
            const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredLogs.length);
            paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${this.filteredLogs.length} logs`;
        }
    }

    /**
     * Render pagination controls
     */
    renderPaginationControls() {
        const paginationContainer = document.getElementById('paginationControls');
        if (!paginationContainer) return;

        if (this.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <div class="pagination">
                <button class="btn btn-outline" ${this.currentPage === 1 ? 'disabled' : ''} onclick="loggingPageManager.goToPage(${this.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span class="pagination-info">Page ${this.currentPage} of ${this.totalPages}</span>
                <button class="btn btn-outline" ${this.currentPage === this.totalPages ? 'disabled' : ''} onclick="loggingPageManager.goToPage(${this.currentPage + 1})">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    /**
     * Navigate to specific page
     * @param {number} page - Page number to navigate to
     */
    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.renderLogs();
    }

    /**
     * Initialize Firebase for user lookups
     * @returns {Promise<boolean>} Initialization success status
     */
    async initializeFirebase() {
        try {
            // Ensure Firebase config is initialized first
            const configInitialized = await firebaseConfig.initialize();
            if (!configInitialized) {
                throw new Error('Firebase configuration failed');
            }

            // Import Firebase modules dynamically
            const { getFirestore, collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Use the already initialized Firebase app
            this.db = getFirestore(firebaseConfig.app);
            
            // Store Firestore functions for later use
            this.firestoreFunctions = {
                collection,
                query,
                where,
                getDocs
            };
            
            console.log('✅ Firebase initialized for user lookups');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Firebase for user lookups:', error);
            return false;
        }
    }

    /**
     * Get user email by username
     * @param {string} username - Username to lookup
     * @returns {Promise<string|null>} User email or null if not found
     */
    async getUserEmailByUsername(username) {
        try {
            // Check cache first
            if (this.userCache.has(username)) {
                return this.userCache.get(username);
            }

            if (!this.db || !this.firestoreFunctions) {
                console.warn('⚠️ Firebase not initialized for user lookups');
                return null;
            }

            const { collection, query, where, getDocs } = this.firestoreFunctions;
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                const email = userData.email || null;
                
                // Cache the result
                this.userCache.set(username, email);
                return email;
            }

            // Cache null result to avoid repeated queries
            this.userCache.set(username, null);
            return null;
        } catch (error) {
            console.error('❌ Error fetching user email:', error);
            return null;
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.realtimeUnsubscribe) {
            this.realtimeUnsubscribe();
            this.realtimeUnsubscribe = null;
        }
        
        // Clear user cache
        this.userCache.clear();
        
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
        
        // Make globally accessible for onclick handlers
        window.loggingPageManager = loggingPageManager;
        
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
        window.loggingPageManager = null;
    }
});

// Legacy function for backward compatibility
window.exportLogs = function() {
    if (loggingPageManager) {
        loggingPageManager.exportLogs();
    }
};