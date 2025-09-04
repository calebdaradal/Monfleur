/**
 * Toast Notification System
 * Provides success notifications for user actions
 * Follows SOLID principles with single responsibility
 */

class ToastManager {
    constructor() {
        this.toastContainer = null;
        this.activeToasts = new Set();
        this.init();
    }

    /**
     * Initialize toast container
     */
    init() {
        this.createToastContainer();
    }

    /**
     * Create toast container element
     */
    createToastContainer() {
        if (this.toastContainer) return;

        this.toastContainer = document.createElement('div');
        this.toastContainer.id = 'toast-container';
        this.toastContainer.className = 'toast-container';
        
        // Add CSS styles
        this.addToastStyles();
        
        document.body.appendChild(this.toastContainer);
    }

    /**
     * Add CSS styles for toast notifications
     */
    addToastStyles() {
        const styleId = 'toast-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .toast-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            }

            .toast {
                background: #10b981;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                margin-bottom: 10px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 300px;
                max-width: 400px;
                pointer-events: auto;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
            }

            .toast.show {
                transform: translateX(0);
                opacity: 1;
            }

            .toast.hide {
                transform: translateX(100%);
                opacity: 0;
            }

            .toast-icon {
                font-size: 16px;
                flex-shrink: 0;
            }

            .toast-message {
                flex: 1;
            }

            .toast-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0;
                margin-left: 8px;
                font-size: 18px;
                line-height: 1;
                opacity: 0.7;
                transition: opacity 0.2s;
            }

            .toast-close:hover {
                opacity: 1;
            }

            /* Success variant */
            .toast.success {
                background: #10b981;
            }

            /* Info variant */
            .toast.info {
                background: #3b82f6;
            }

            /* Warning variant */
            .toast.warning {
                background: #f59e0b;
            }

            /* Error variant */
            .toast.error {
                background: #ef4444;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Show success toast notification
     * @param {string} message - Success message to display
     * @param {number} duration - Duration in milliseconds (default: 4000)
     */
    showSuccess(message, duration = 4000) {
        this.showToast(message, 'success', '✓', duration);
    }

    /**
     * Show info toast notification
     * @param {string} message - Info message to display
     * @param {number} duration - Duration in milliseconds (default: 4000)
     */
    showInfo(message, duration = 4000) {
        this.showToast(message, 'info', 'ℹ', duration);
    }

    /**
     * Show warning toast notification
     * @param {string} message - Warning message to display
     * @param {number} duration - Duration in milliseconds (default: 5000)
     */
    showWarning(message, duration = 5000) {
        this.showToast(message, 'warning', '⚠', duration);
    }

    /**
     * Show error toast notification
     * @param {string} message - Error message to display
     * @param {number} duration - Duration in milliseconds (default: 6000)
     */
    showError(message, duration = 6000) {
        this.showToast(message, 'error', '✕', duration);
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, info, warning, error)
     * @param {string} icon - Icon to display
     * @param {number} duration - Duration in milliseconds
     */
    showToast(message, type = 'success', icon = '✓', duration = 4000) {
        const toast = this.createToastElement(message, type, icon);
        
        this.toastContainer.appendChild(toast);
        this.activeToasts.add(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-hide after duration
        setTimeout(() => {
            this.hideToast(toast);
        }, duration);
    }

    /**
     * Create toast element
     * @param {string} message - Message to display
     * @param {string} type - Toast type
     * @param {string} icon - Icon to display
     * @returns {HTMLElement} Toast element
     */
    createToastElement(message, type, icon) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Close notification">&times;</button>
        `;

        // Add close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.hideToast(toast);
        });

        return toast;
    }

    /**
     * Hide toast notification
     * @param {HTMLElement} toast - Toast element to hide
     */
    hideToast(toast) {
        if (!this.activeToasts.has(toast)) return;

        toast.classList.remove('show');
        toast.classList.add('hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.activeToasts.delete(toast);
        }, 300); // Match CSS transition duration
    }

    /**
     * Clear all active toasts
     */
    clearAll() {
        this.activeToasts.forEach(toast => {
            this.hideToast(toast);
        });
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
}

// Create global instance
const toastManager = new ToastManager();

// Export for use in other modules
export default toastManager;

// Also make available globally for onclick handlers
window.toastManager = toastManager;