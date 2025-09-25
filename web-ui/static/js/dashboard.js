/**
 * Digital Twin Dashboard - Core JavaScript
 * 
 * Handles global dashboard functionality including theme switching,
 * mobile navigation, notifications, and common UI interactions.
 */

class DashboardManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.notifications = [];
        this.notificationId = 0;
        
        // Initialize after DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize dashboard functionality
     */
    init() {
        this.initTheme();
        this.initMobileNavigation();
        this.initNotificationSystem();
        this.initGlobalEventListeners();
        this.initKeyboardNavigation();
        this.loadRecentThings();
        
        console.log('Dashboard Manager initialized');
    }

    /**
     * Initialize theme system
     */
    initTheme() {
        // Apply saved theme
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Update theme toggle button
        this.updateThemeToggleButton();
        
        // Add theme toggle event listener
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        this.updateThemeToggleButton();
        
        // Announce theme change for accessibility
        this.announceToScreenReader(`Switched to ${this.theme} theme`);
    }

    /**
     * Update theme toggle button icon
     */
    updateThemeToggleButton() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
            themeToggle.title = `Switch to ${this.theme === 'light' ? 'dark' : 'light'} theme`;
        }
    }

    /**
     * Initialize mobile navigation
     */
    initMobileNavigation() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
        const mobileNavClose = document.getElementById('mobile-nav-close');

        if (mobileMenuToggle && mobileNavOverlay) {
            // Open mobile menu
            mobileMenuToggle.addEventListener('click', () => {
                mobileNavOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Focus on close button for accessibility
                if (mobileNavClose) {
                    mobileNavClose.focus();
                }
            });

            // Close mobile menu
            const closeMobileMenu = () => {
                mobileNavOverlay.classList.remove('active');
                document.body.style.overflow = '';
                mobileMenuToggle.focus(); // Return focus to toggle button
            };

            if (mobileNavClose) {
                mobileNavClose.addEventListener('click', closeMobileMenu);
            }

            // Close on overlay click
            mobileNavOverlay.addEventListener('click', (e) => {
                if (e.target === mobileNavOverlay) {
                    closeMobileMenu();
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && mobileNavOverlay.classList.contains('active')) {
                    closeMobileMenu();
                }
            });
        }
    }

    /**
     * Initialize notification system
     */
    initNotificationSystem() {
        // Create notification manager
        window.notificationManager = {
            show: (message, type = 'info', title = null, duration = 5000) => {
                return this.showNotification(message, type, title, duration);
            },
            hide: (notificationId) => {
                return this.hideNotification(notificationId);
            },
            clear: () => {
                return this.clearAllNotifications();
            }
        };

        // Test notification system
        console.log('Notification system initialized');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info', title = null, duration = 5000) {
        const notificationId = ++this.notificationId;
        const container = document.getElementById('notification-container');
        
        if (!container) {
            console.warn('Notification container not found');
            return notificationId;
        }

        const notification = this.createNotificationElement(notificationId, message, type, title);
        container.appendChild(notification);
        
        // Store notification reference
        this.notifications.push({
            id: notificationId,
            element: notification,
            type,
            message,
            title
        });

        // Auto-hide after duration (unless it's an error)
        if (type !== 'error' && duration > 0) {
            setTimeout(() => {
                this.hideNotification(notificationId);
            }, duration);
        }

        // Announce to screen readers
        this.announceToScreenReader(`${title || type}: ${message}`);

        return notificationId;
    }

    /**
     * Create notification element
     */
    createNotificationElement(id, message, type, title) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.notificationId = id;

        const iconMap = {
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };

        const defaultTitles = {
            success: 'Success',
            warning: 'Warning',
            error: 'Error',
            info: 'Information'
        };

        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${iconMap[type] || iconMap.info}"></i>
            </div>
            <div class="notification-content">
                <h4 class="notification-title">${title || defaultTitles[type] || 'Notification'}</h4>
                <p class="notification-message">${message}</p>
            </div>
            <button class="notification-close" type="button" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add close event listener
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            this.hideNotification(id);
        });

        return notification;
    }

    /**
     * Hide notification
     */
    hideNotification(notificationId) {
        const notificationIndex = this.notifications.findIndex(n => n.id === notificationId);
        if (notificationIndex === -1) return false;

        const notification = this.notifications[notificationIndex];
        const element = notification.element;

        // Add fade out animation
        element.style.animation = 'slideOut 0.3s ease-in forwards';
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.splice(notificationIndex, 1);
        }, 300);

        return true;
    }

    /**
     * Clear all notifications
     */
    clearAllNotifications() {
        this.notifications.forEach(notification => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
        });
        this.notifications = [];
    }

    /**
     * Initialize global event listeners
     */
    initGlobalEventListeners() {
        // Handle form submissions globally
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.classList.contains('async-form')) {
                e.preventDefault();
                this.handleAsyncForm(form);
            }
        });

        // Handle click events globally
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (target) {
                const action = target.dataset.action;
                this.handleGlobalAction(action, target, e);
            }
        });

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleWindowResize();
            }, 250);
        });

        // Handle online/offline events
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success', 'Network Status');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Connection lost', 'warning', 'Network Status');
        });
    }

    /**
     * Handle async form submissions
     */
    async handleAsyncForm(form) {
        try {
            const formData = new FormData(form);
            const url = form.action || window.location.href;
            const method = form.method || 'POST';

            // Show loading state
            const submitButton = form.querySelector('[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.dataset.originalText = submitButton.textContent;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }

            const response = await fetch(url, {
                method: method.toUpperCase(),
                body: formData
            });

            if (response.ok) {
                this.showNotification('Form submitted successfully', 'success');
                form.reset();
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

        } catch (error) {
            this.showNotification(`Form submission failed: ${error.message}`, 'error');
        } finally {
            // Restore submit button
            const submitButton = form.querySelector('[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = submitButton.dataset.originalText || 'Submit';
            }
        }
    }

    /**
     * Handle global actions
     */
    handleGlobalAction(action, target, event) {
        switch (action) {
            case 'copy-text':
                this.copyTextToClipboard(target.dataset.text || target.textContent);
                break;
                
            case 'toggle-class':
                const toggleTarget = target.dataset.target ? 
                    document.querySelector(target.dataset.target) : target;
                const toggleClass = target.dataset.class;
                if (toggleTarget && toggleClass) {
                    toggleTarget.classList.toggle(toggleClass);
                }
                break;
                
            case 'confirm-action':
                const message = target.dataset.message || 'Are you sure?';
                if (!confirm(message)) {
                    event.preventDefault();
                    return false;
                }
                break;
                
            default:
                console.log(`Unknown global action: ${action}`);
        }
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        // Close mobile menu if window becomes large
        const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
        if (mobileNavOverlay && window.innerWidth > 768) {
            mobileNavOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Initialize keyboard navigation
     */
    initKeyboardNavigation() {
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('[type="search"], .search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Alt + N for new thing
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                const createLink = document.querySelector('a[href*="create"]');
                if (createLink) {
                    createLink.click();
                }
            }

            // Alt + D for dashboard
            if (e.altKey && e.key === 'd') {
                e.preventDefault();
                const dashboardLink = document.querySelector('a[href*="dashboard"]');
                if (dashboardLink) {
                    dashboardLink.click();
                }
            }
        });

        // Improve focus visibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    /**
     * Copy text to clipboard
     */
    async copyTextToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Text copied to clipboard', 'success', null, 2000);
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showNotification('Text copied to clipboard', 'success', null, 2000);
            } catch (fallbackError) {
                this.showNotification('Failed to copy text', 'error');
            }
            
            document.body.removeChild(textArea);
        }
    }

    /**
     * Announce to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * Format date for display
     */
    formatDate(date, options = {}) {
        if (!date) return '';
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const formatOptions = { ...defaultOptions, ...options };
        
        try {
            if (typeof date === 'string') {
                date = new Date(date);
            }
            return date.toLocaleDateString('en-US', formatOptions);
        } catch (error) {
            console.error('Date formatting error:', error);
            return String(date);
        }
    }

    /**
     * Debounce function
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Validate form field
     */
    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        const pattern = field.pattern;
        const minLength = field.minLength;
        const maxLength = field.maxLength;

        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        
        // Pattern validation
        else if (value && pattern && !new RegExp(pattern).test(value)) {
            isValid = false;
            errorMessage = field.title || 'Invalid format';
        }
        
        // Length validation
        else if (value && minLength && value.length < minLength) {
            isValid = false;
            errorMessage = `Minimum ${minLength} characters required`;
        }
        
        else if (value && maxLength && value.length > maxLength) {
            isValid = false;
            errorMessage = `Maximum ${maxLength} characters allowed`;
        }
        
        // Type-specific validation
        else if (value && type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            isValid = false;
            errorMessage = 'Invalid email address';
        }
        
        else if (value && type === 'url' && !/^https?:\/\/.+/.test(value)) {
            isValid = false;
            errorMessage = 'Invalid URL format';
        }

        // Update field UI
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup?.querySelector('.form-error');

        if (formGroup) {
            formGroup.classList.toggle('error', !isValid);
        }

        if (errorElement) {
            errorElement.textContent = errorMessage;
        }

        return isValid;
    }

    /**
     * Get browser info
     */
    getBrowserInfo() {
        const ua = navigator.userAgent;
        const browsers = {
            chrome: /Chrome/.test(ua) && !/Edge/.test(ua),
            firefox: /Firefox/.test(ua),
            safari: /Safari/.test(ua) && !/Chrome/.test(ua),
            edge: /Edge/.test(ua),
            ie: /Trident/.test(ua)
        };

        return Object.keys(browsers).find(browser => browsers[browser]) || 'unknown';
    }

    /**
     * Check if device is mobile
     */
    isMobile() {
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Load recent things for dashboard
     */
    async loadRecentThings() {
        const recentThingsList = document.getElementById('recent-things-list');
        if (!recentThingsList) {
            console.warn('Recent things list element not found');
            return;
        }

        try {
            // Show loading state
            recentThingsList.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-spinner fa-spin"></i>
                    Loading recent things...
                </div>
            `;

            // Get things from API
            const response = await window.apiClient.getMongoThings();
            const things = response.data.things || [];

            if (things.length === 0) {
                recentThingsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-cube"></i>
                        <p>No things found</p>
                        <a href="/create-thing" class="btn btn-primary">Create Your First Thing</a>
                    </div>
                `;
                return;
            }

            // Display recent things (limit to 5 most recent)
            const recentThings = things.slice(0, 5);
            const thingsHtml = recentThings.map(thing => `
                <div class="recent-thing-item" data-thing-id="${thing.thingId}">
                    <div class="thing-header">
                        <h4 class="thing-id">${thing.thingId}</h4>
                        <span class="thing-status status-${thing.status || 'unknown'}">
                            ${(thing.status || 'unknown').toUpperCase()}
                        </span>
                    </div>
                    <div class="thing-meta">
                        ${thing.attributes?.manufacturer ? `<span class="meta-item">Manufacturer: ${thing.attributes.manufacturer}</span>` : ''}
                        ${thing.attributes?.model ? `<span class="meta-item">Model: ${thing.attributes.model}</span>` : ''}
                        ${thing.attributes?.location ? `<span class="meta-item">Location: ${thing.attributes.location}</span>` : ''}
                    </div>
                    <div class="thing-actions">
                        <a href="/edit-thing/${thing.thingId}" class="btn btn-sm btn-secondary">
                            <i class="fas fa-edit"></i> Edit
                        </a>
                        <button class="btn btn-sm btn-outline" onclick="viewThingDetails('${thing.thingId}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </div>
            `).join('');

            recentThingsList.innerHTML = thingsHtml;

            console.log(`Loaded ${recentThings.length} recent things`);

        } catch (error) {
            console.error('Failed to load recent things:', error);
            recentThingsList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load things</p>
                    <button class="btn btn-secondary" onclick="window.dashboardManager.loadRecentThings()">
                        <i class="fas fa-retry"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Refresh current page
     */
    refresh() {
        this.showNotification('Refreshing...', 'info', null, 1000);
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }
}

// CSS animations for notifications
const notificationStyles = `
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .keyboard-navigation *:focus {
        outline: 2px solid var(--primary-color) !important;
        outline-offset: 2px !important;
    }
`;

// Add styles to document
if (!document.getElementById('dashboard-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'dashboard-styles';
    styleSheet.textContent = notificationStyles;
    document.head.appendChild(styleSheet);
}

// Initialize dashboard manager
window.dashboardManager = new DashboardManager();

// Global helper functions
window.viewThingDetails = function(thingId) {
    // This could open a modal or navigate to a details page
    console.log('Viewing details for thing:', thingId);
    // For now, just navigate to the edit page
    window.location.href = `/edit-thing/${thingId}`;
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}