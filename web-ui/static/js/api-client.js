/**
 * Digital Twin API Client
 * 
 * A comprehensive client for interacting with the Digital Twin platform API.
 * Handles all CRUD operations for digital twins and provides error handling,
 * loading states, and response formatting.
 */

class ApiClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        // Request interceptors for loading states
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        
        // Setup default error handling
        this.setupErrorHandling();
    }

    /**
     * Setup global error handling and loading states
     */
    setupErrorHandling() {
        // Add request interceptor for loading states
        this.addRequestInterceptor((config) => {
            if (config.showLoading !== false) {
                this.showLoading();
            }
            return config;
        });

        // Add response interceptor for error handling
        this.addResponseInterceptor(
            (response) => {
                this.hideLoading();
                return response;
            },
            (error) => {
                this.hideLoading();
                this.handleError(error);
                throw error;
            }
        );
    }

    /**
     * Add request interceptor
     */
    addRequestInterceptor(onFulfilled, onRejected) {
        this.requestInterceptors.push({ onFulfilled, onRejected });
    }

    /**
     * Add response interceptor
     */
    addResponseInterceptor(onFulfilled, onRejected) {
        this.responseInterceptors.push({ onFulfilled, onRejected });
    }

    /**
     * Execute request interceptors
     */
    async executeRequestInterceptors(config) {
        let processedConfig = config;
        for (const interceptor of this.requestInterceptors) {
            if (interceptor.onFulfilled) {
                try {
                    processedConfig = await interceptor.onFulfilled(processedConfig);
                } catch (error) {
                    if (interceptor.onRejected) {
                        processedConfig = await interceptor.onRejected(error);
                    } else {
                        throw error;
                    }
                }
            }
        }
        return processedConfig;
    }

    /**
     * Execute response interceptors
     */
    async executeResponseInterceptors(response, isError = false) {
        let processedResponse = response;
        for (const interceptor of this.responseInterceptors) {
            try {
                if (isError && interceptor.onRejected) {
                    processedResponse = await interceptor.onRejected(processedResponse);
                } else if (!isError && interceptor.onFulfilled) {
                    processedResponse = await interceptor.onFulfilled(processedResponse);
                }
            } catch (error) {
                if (!isError && interceptor.onRejected) {
                    processedResponse = await interceptor.onRejected(error);
                } else {
                    throw error;
                }
            }
        }
        return processedResponse;
    }

    /**
     * Core request method with interceptors
     */
    async request(config) {
        try {
            // Execute request interceptors
            const processedConfig = await this.executeRequestInterceptors(config);
            
            // Make the actual request
            const response = await this.makeRequest(processedConfig);
            
            // Execute response interceptors
            return await this.executeResponseInterceptors(response);
            
        } catch (error) {
            // Execute error interceptors
            await this.executeResponseInterceptors(error, true);
            throw error;
        }
    }

    /**
     * Make the actual HTTP request
     */
    async makeRequest(config) {
        const {
            url,
            method = 'GET',
            headers = {},
            body,
            params,
            timeout = 30000
        } = config;

        // Build URL with parameters
        let requestUrl = this.baseUrl + url;
        if (params) {
            const searchParams = new URLSearchParams(params);
            requestUrl += '?' + searchParams.toString();
        }

        // Build headers
        const requestHeaders = { ...this.defaultHeaders, ...headers };

        // Build request options
        const requestOptions = {
            method: method.toUpperCase(),
            headers: requestHeaders
        };

        // Add body for non-GET requests
        if (body && method.toUpperCase() !== 'GET') {
            if (typeof body === 'object') {
                requestOptions.body = JSON.stringify(body);
            } else {
                requestOptions.body = body;
            }
        }

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        requestOptions.signal = controller.signal;

        try {
            const response = await fetch(requestUrl, requestOptions);
            clearTimeout(timeoutId);

            // Parse response
            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            // Check if response is successful
            if (!response.ok) {
                throw new ApiError(
                    data.message || `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    data
                );
            }

            return {
                data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            };

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new ApiError('Request timeout', 408);
            }
            
            if (error instanceof ApiError) {
                throw error;
            }
            
            throw new ApiError(
                error.message || 'Network error occurred',
                0,
                { originalError: error }
            );
        }
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }

    /**
     * Handle API errors
     */
    handleError(error) {
        console.error('API Error:', error);
        
        let message = 'An unexpected error occurred';
        let type = 'error';

        if (error instanceof ApiError) {
            message = error.message;
            
            if (error.status >= 400 && error.status < 500) {
                type = 'warning';
            }
        } else if (error.message) {
            message = error.message;
        }

        // Show notification
        this.showNotification(message, type);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info', title = null) {
        if (window.notificationManager) {
            window.notificationManager.show(message, type, title);
        } else {
            // Fallback to console if notification manager not available
            console.log(`[${type.toUpperCase()}] ${title || 'Notification'}: ${message}`);
        }
    }

    // ==================== THINGS API METHODS ====================

    /**
     * Get all things
     */
    async getThings(params = {}) {
        return this.request({
            url: '/things',
            method: 'GET',
            params
        });
    }

    /**
     * Get a specific thing by ID
     */
    async getThing(thingId) {
        return this.request({
            url: `/things/${encodeURIComponent(thingId)}`,
            method: 'GET'
        });
    }

    /**
     * Create a new thing
     */
    async createThing(thingData) {
        return this.request({
            url: '/things',
            method: 'POST',
            body: thingData
        });
    }

    /**
     * Update a thing (partial update)
     */
    async updateThing(thingId, updateData) {
        return this.request({
            url: `/things/${encodeURIComponent(thingId)}`,
            method: 'PATCH',
            body: updateData
        });
    }

    /**
     * Replace a thing (full replacement)
     */
    async replaceThing(thingId, thingData) {
        return this.request({
            url: `/things/${encodeURIComponent(thingId)}`,
            method: 'PUT',
            body: thingData
        });
    }

    /**
     * Delete a thing
     */
    async deleteThing(thingId) {
        return this.request({
            url: `/things/${encodeURIComponent(thingId)}`,
            method: 'DELETE'
        });
    }

    /**
     * Bulk delete things
     */
    async bulkDeleteThings(thingIds) {
        const promises = thingIds.map(id => this.deleteThing(id));
        return Promise.allSettled(promises);
    }

    // ==================== MONGODB API METHODS ====================

    /**
     * Get things from MongoDB
     */
    async getMongoThings(params = {}) {
        return this.request({
            url: '/mongodb/things',
            method: 'GET',
            params
        });
    }

    /**
     * Get a specific thing from MongoDB
     */
    async getMongoThing(thingId) {
        return this.request({
            url: `/mongodb/things/${encodeURIComponent(thingId)}`,
            method: 'GET'
        });
    }

    /**
     * Create thing in MongoDB
     */
    async createMongoThing(thingData) {
        return this.request({
            url: '/mongodb/things',
            method: 'POST',
            body: thingData
        });
    }

    /**
     * Update thing in MongoDB
     */
    async updateMongoThing(thingId, updateData) {
        return this.request({
            url: `/mongodb/things/${encodeURIComponent(thingId)}`,
            method: 'PATCH',
            body: updateData
        });
    }

    /**
     * Replace thing in MongoDB
     */
    async replaceMongoThing(thingId, thingData) {
        return this.request({
            url: `/mongodb/things/${encodeURIComponent(thingId)}`,
            method: 'PUT',
            body: thingData
        });
    }

    /**
     * Delete thing from MongoDB
     */
    async deleteMongoThing(thingId) {
        return this.request({
            url: `/mongodb/things/${encodeURIComponent(thingId)}`,
            method: 'DELETE'
        });
    }

    // ==================== SYSTEM API METHODS ====================

    /**
     * Get system status
     */
    async getSystemStatus() {
        return this.request({
            url: '/api/status',
            method: 'GET',
            showLoading: false
        });
    }

    /**
     * Test connections
     */
    async testConnections() {
        return this.request({
            url: '/test-connections',
            method: 'GET'
        });
    }

    /**
     * Get API documentation
     */
    async getApiDocs() {
        return this.request({
            url: '/api/openapi.json',
            method: 'GET'
        });
    }

    // ==================== HELPER METHODS ====================

    /**
     * Validate thing data
     */
    validateThingData(thingData) {
        const errors = [];

        if (!thingData.thingId) {
            errors.push('Thing ID is required');
        }

        if (thingData.thingId && !/^[a-zA-Z0-9._:-]+$/.test(thingData.thingId)) {
            errors.push('Thing ID contains invalid characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Format thing data for API
     */
    formatThingData(formData) {
        const thingData = {
            thingId: formData.thingId
        };

        // Add attributes if provided
        const attributes = {};
        if (formData.manufacturer) attributes.manufacturer = formData.manufacturer;
        if (formData.model) attributes.model = formData.model;
        if (formData.serialNumber) attributes.serialNumber = formData.serialNumber;
        if (formData.location) attributes.location = formData.location;

        if (Object.keys(attributes).length > 0) {
            thingData.attributes = attributes;
        }

        // Add features if provided
        if (formData.features && Object.keys(formData.features).length > 0) {
            thingData.features = formData.features;
        }

        // Add definition if provided
        if (formData.definition) {
            thingData.definition = formData.definition;
        }

        // Add policy ID if provided
        if (formData.policyId) {
            thingData.policyId = formData.policyId;
        }

        return thingData;
    }

    /**
     * Parse error response
     */
    parseErrorResponse(error) {
        if (error instanceof ApiError) {
            return {
                message: error.message,
                status: error.status,
                details: error.data
            };
        }

        return {
            message: error.message || 'Unknown error',
            status: 0,
            details: null
        };
    }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(message, status = 0, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Create and export a global API client instance
 */
window.apiClient = new ApiClient();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, ApiError };
}