/**
 * Logging Service
 * Handles automatic logging of character-related activities to Firebase Realtime Database
 * Follows Single Responsibility and Open/Closed Principles
 */

import firebaseConfig from '../config/firebase-config.js';

/**
 * Logging Service Class
 * Manages automatic logging of character operations (EDIT, UPLOAD, DELETE)
 * Provides real-time logging capabilities with Firebase integration
 */
class LoggingService {
    constructor() {
        this.database = null;
        this.isInitialized = false;
        this.databaseFunctions = null;
        
        console.log('📝 Logging Service initialized');
    }

    /**
     * Initialize Firebase Realtime Database connection
     * @returns {Promise<boolean>} Initialization success status
     */
    async initialize() {
        try {
            // Initialize Firebase config if not already done
            const configInitialized = await firebaseConfig.initialize();
            if (!configInitialized) {
                throw new Error('Firebase configuration failed');
            }

            // Import Firebase Realtime Database functions
            const { 
                getDatabase,
                ref,
                push,
                set,
                onValue,
                off,
                query,
                orderByChild,
                limitToLast
            } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            
            this.database = getDatabase(firebaseConfig.app);
            
            // Store database functions for later use
            this.databaseFunctions = {
                ref,
                push,
                set,
                onValue,
                off,
                query,
                orderByChild,
                limitToLast
            };
            
            this.isInitialized = true;
            console.log('✅ Logging Service initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Logging Service initialization failed:', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Log character-related activity
     * @param {string} actionType - Type of action (EDIT, UPLOAD, DELETE)
     * @param {string} username - Username performing the action
     * @param {string} masterlistNumber - Character masterlist number
     * @param {Object} additionalData - Optional additional data
     * @returns {Promise<boolean>} Success status
     */
    async logCharacterActivity(actionType, username, masterlistNumber, additionalData = {}) {
        try {
            if (!this.isInitialized) {
                console.warn('⚠️ Logging Service not initialized, attempting to initialize...');
                const initialized = await this.initialize();
                if (!initialized) {
                    throw new Error('Failed to initialize logging service');
                }
            }

            // Validate action type
            const validActionTypes = ['EDIT', 'UPLOAD', 'DELETE'];
            if (!validActionTypes.includes(actionType)) {
                throw new Error(`Invalid action type: ${actionType}. Must be one of: ${validActionTypes.join(', ')}`);
            }

            // Create log entry
            const logEntry = {
                timestamp: new Date().toISOString(),
                type: actionType,
                user: username || 'Unknown User',
                masterlistNumber: masterlistNumber || 'Unknown',
                details: `${masterlistNumber || 'Unknown'}`,
                ...additionalData
            };

            // Push to Firebase Realtime Database
            const { ref, push, set } = this.databaseFunctions;
            const logsRef = ref(this.database, 'actionlogs');
            const newLogRef = push(logsRef);
            
            await set(newLogRef, logEntry);
            
            console.log(`📝 Logged ${actionType} activity for ${masterlistNumber} by ${username}`);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to log character activity:', error);
            return false;
        }
    }

    /**
     * Log user-related activity
     * @param {string} actionType - Type of action (EDIT, CREATE, DELETE, etc.)
     * @param {string} performedBy - Username performing the action
     * @param {string} targetUser - Target user (for admin actions) or same as performedBy (for self actions)
     * @param {Object} additionalData - Optional additional data
     * @returns {Promise<boolean>} Success status
     */
    async logUserActivity(actionType, performedBy, targetUser, additionalData = {}) {
        try {
            if (!this.isInitialized) {
                console.warn('⚠️ Logging Service not initialized, attempting to initialize...');
                const initialized = await this.initialize();
                if (!initialized) {
                    throw new Error('Failed to initialize logging service');
                }
            }

            // Validate action type
            const validActionTypes = ['EDIT', 'CREATE', 'DELETE', 'USER_EDIT', 'PASSWORD_CHANGE', 'ROLE_CHANGE', 'ADMIN_EDIT'];
            if (!validActionTypes.includes(actionType)) {
                throw new Error(`Invalid action type: ${actionType}. Must be one of: ${validActionTypes.join(', ')}`);
            }

            // Create log entry with user-friendly details
            let details = '';
            switch (actionType) {
                case 'USER_EDIT':
                    const oldUsername = additionalData.oldUsername || 'Unknown';
                    const newUsername = additionalData.newUsername || 'Unknown';
                    details = `Username changed from "${oldUsername}" to "${newUsername}"`;
                    break;
                case 'PASSWORD_CHANGE':
                    details = 'Password updated';
                    break;
                case 'ROLE_CHANGE':
                    const oldRole = additionalData.oldRole || 'Unknown';
                    const newRole = additionalData.newRole || 'Unknown';
                    details = `Role changed from "${oldRole}" to "${newRole}"`;
                    break;
                case 'ADMIN_EDIT':
                    if (additionalData.action === 'status_change') {
                        const newStatus = additionalData.newStatus ? 'Active' : 'Inactive';
                        details = `"${targetUser}" Account status changed to ${newStatus}`;
                    } else if (additionalData.action === 'create') {
                        details = `Created user account "${targetUser}"`;
                    } else if (additionalData.action === 'delete') {
                        details = `Deleted account "${targetUser}"`;
                    } else {
                        details = additionalData.details || `Admin action performed on "${targetUser}"`;
                    }
                    break;
                case 'CREATE':
                    details = `Created user account "${targetUser}"`;
                    break;
                case 'DELETE':
                    details = `Deleted account "${targetUser}"`;
                    break;
                case 'EDIT':
                    details = additionalData.details || 'User profile updated';
                    break;
                default:
                    details = additionalData.details || `${actionType} action performed`;
            }

            const logEntry = {
                timestamp: new Date().toISOString(),
                type: actionType,
                user: performedBy || 'Unknown User',
                targetUser: targetUser || performedBy || 'Unknown User',
                details: details,
                category: 'USER',
                ...additionalData
            };

            // Push to Firebase Realtime Database
            const { ref, push, set } = this.databaseFunctions;
            const logsRef = ref(this.database, 'actionlogs');
            const newLogRef = push(logsRef);
            
            await set(newLogRef, logEntry);
            
            console.log(`📝 Logged ${actionType} activity for user ${targetUser} by ${performedBy}`);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to log user activity:', error);
            return false;
        }
    }

    /**
     * Get all logs with optional filtering
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} Array of log entries
     */
    async getLogs(filters = {}) {
        try {
            if (!this.isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) {
                    throw new Error('Failed to initialize logging service');
                }
            }

            const { ref, query, orderByChild, limitToLast } = this.databaseFunctions;
            const logsRef = ref(this.database, 'actionlogs');
            
            // Create query with ordering and limiting
            let logsQuery = query(logsRef, orderByChild('timestamp'));
            
            if (filters.limit) {
                logsQuery = query(logsRef, orderByChild('timestamp'), limitToLast(filters.limit));
            }

            return new Promise((resolve, reject) => {
                const { onValue } = this.databaseFunctions;
                onValue(logsQuery, (snapshot) => {
                    const logs = [];
                    if (snapshot.exists()) {
                        snapshot.forEach((childSnapshot) => {
                            const log = {
                                id: childSnapshot.key,
                                ...childSnapshot.val()
                            };
                            logs.push(log);
                        });
                    }
                    
                    // Sort by timestamp descending (newest first)
                    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    
                    // Apply additional filters
                    const filteredLogs = this.applyFilters(logs, filters);
                    resolve(filteredLogs);
                }, (error) => {
                    console.error('❌ Failed to fetch logs:', error);
                    reject(error);
                });
            });
            
        } catch (error) {
            console.error('❌ Failed to get logs:', error);
            return [];
        }
    }

    /**
     * Set up real-time listener for logs
     * @param {Function} callback - Callback function to handle log updates
     * @param {Object} filters - Filter criteria
     * @returns {Function} Unsubscribe function
     */
    async setupRealtimeListener(callback, filters = {}) {
        try {
            if (!this.isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) {
                    throw new Error('Failed to initialize logging service');
                }
            }

            const { ref, query, orderByChild, limitToLast, onValue } = this.databaseFunctions;
            const logsRef = ref(this.database, 'actionlogs');
            
            // Create query with ordering and limiting
            let logsQuery = query(logsRef, orderByChild('timestamp'));
            
            if (filters.limit) {
                logsQuery = query(logsRef, orderByChild('timestamp'), limitToLast(filters.limit));
            }

            const unsubscribe = onValue(logsQuery, (snapshot) => {
                const logs = [];
                if (snapshot.exists()) {
                    snapshot.forEach((childSnapshot) => {
                        const log = {
                            id: childSnapshot.key,
                            ...childSnapshot.val()
                        };
                        logs.push(log);
                    });
                }
                
                // Sort by timestamp descending (newest first)
                logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                // Apply additional filters
                const filteredLogs = this.applyFilters(logs, filters);
                callback(filteredLogs);
            });

            return unsubscribe;
            
        } catch (error) {
            console.error('❌ Failed to setup realtime listener:', error);
            return () => {}; // Return empty unsubscribe function
        }
    }

    /**
     * Apply filters to log entries
     * @param {Array} logs - Array of log entries
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered log entries
     */
    applyFilters(logs, filters) {
        let filteredLogs = [...logs];

        // Filter by type
        if (filters.type && filters.type !== 'all') {
            filteredLogs = filteredLogs.filter(log => 
                log.type && log.type.toLowerCase() === filters.type.toLowerCase()
            );
        }

        // Filter by date range
        if (filters.dateRange) {
            const now = new Date();
            let startDate;

            switch (filters.dateRange) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                default:
                    startDate = null;
            }

            if (startDate) {
                filteredLogs = filteredLogs.filter(log => 
                    new Date(log.timestamp) >= startDate
                );
            }
        }

        // Filter by user
        if (filters.user) {
            filteredLogs = filteredLogs.filter(log => 
                log.user && log.user.toLowerCase().includes(filters.user.toLowerCase())
            );
        }

        return filteredLogs;
    }

    /**
     * Format timestamp for display
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Formatted timestamp
     */
    formatTimestamp(timestamp) {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(',', '');
        } catch (error) {
            console.error('❌ Failed to format timestamp:', error);
            return timestamp;
        }
    }

    /**
     * Export logs to CSV format
     * @param {Array} logs - Array of log entries
     * @returns {string} CSV formatted string
     */
    exportToCSV(logs) {
        try {
            const headers = ['Timestamp', 'Type', 'User', 'Character', 'Changes'];
            const csvContent = [
                headers.join(','),
                ...logs.map(log => {
                    // Format detailed changes for CSV
                    let changesText = '';
                    
                    if (log.changes && Array.isArray(log.changes) && log.changes.length > 0) {
                        // Multiple changes
                        changesText = log.changes.map(change => {
                            if (typeof change === 'object' && change !== null) {
                                // Use displayName for better readability
                                const fieldName = change.displayName || change.field || 'Field';
                                const fromValue = change.from || change.oldValue || '(empty)';
                                const toValue = change.to || change.newValue || '(empty)';
                                
                                if (fromValue !== undefined && toValue !== undefined) {
                                    return `${fieldName}: ${fromValue} --> ${toValue}`;
                                }
                                return change.changeText || change.text || JSON.stringify(change);
                            }
                            return String(change);
                        }).join('; ');
                    } else if (log.changes && typeof log.changes === 'string') {
                        // Single change as string
                        changesText = log.changes;
                    } else if (log.changes && typeof log.changes === 'object' && log.changes !== null) {
                        // Handle single object change
                        try {
                            const fieldName = log.changes.displayName || log.changes.field || 'Field';
                            const fromValue = log.changes.from || log.changes.oldValue;
                            const toValue = log.changes.to || log.changes.newValue;
                            
                            if (fromValue !== undefined && toValue !== undefined) {
                                changesText = `${fieldName}: ${fromValue} --> ${toValue}`;
                            } else if (log.changes.changeText) {
                                changesText = log.changes.changeText;
                            } else {
                                changesText = JSON.stringify(log.changes);
                            }
                        } catch (e) {
                            changesText = '[Complex Object]';
                        }
                    } else if (log.details) {
                        // Fallback to details
                        changesText = String(log.details);
                    }
                    
                    return [
                        `"${this.formatTimestamp(log.timestamp)}"`,
                        `"${log.type || ''}"`,
                        `"${log.user || ''}"`,
                        `"${log.masterlistNumber || ''}"`,
                        `"${String(changesText).replace(/"/g, '""')}"`  // Escape quotes in CSV
                    ].join(',');
                })
            ].join('\n');

            return csvContent;
        } catch (error) {
            console.error('❌ Failed to export logs to CSV:', error);
            return '';
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.database && this.databaseFunctions) {
            // Clean up any active listeners if needed
            console.log('🧹 Logging Service destroyed');
        }
        this.isInitialized = false;
    }
}

// Create singleton instance
const loggingService = new LoggingService();

export default loggingService;