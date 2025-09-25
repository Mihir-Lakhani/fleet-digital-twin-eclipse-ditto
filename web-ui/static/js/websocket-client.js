/**
 * WebSocket Client for Real-time Updates
 * 
 * Manages WebSocket connections for real-time updates of digital twins
 * and dashboard data. Provides fallback to Server-Sent Events (SSE).
 */

class WebSocketClient {
    constructor(options = {}) {
        this.url = options.url || this.getWebSocketUrl();
        this.protocols = options.protocols || [];
        this.reconnectInterval = options.reconnectInterval || 5000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        this.heartbeatInterval = options.heartbeatInterval || 30000;
        
        this.websocket = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.heartbeatTimer = null;
        this.messageHandlers = new Map();
        this.eventHandlers = new Map();
        
        // SSE fallback
        this.eventSource = null;
        this.useSSE = false;
        
        this.init();
    }

    /**
     * Initialize WebSocket client
     */
    init() {
        this.setupEventHandlers();
        console.log('WebSocket Client initialized');
    }

    /**
     * Get WebSocket URL from current location
     */
    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/ws`;
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Register default message handlers
        this.on('thing.created', (data) => this.handleThingCreated(data));
        this.on('thing.updated', (data) => this.handleThingUpdated(data));
        this.on('thing.deleted', (data) => this.handleThingDeleted(data));
        this.on('dashboard.stats', (data) => this.handleDashboardStats(data));
        this.on('system.notification', (data) => this.handleSystemNotification(data));
    }

    /**
     * Connect to WebSocket server
     */
    async connect() {
        if (this.isConnected || this.isConnecting) {
            return;
        }

        this.isConnecting = true;

        try {
            // Try WebSocket first
            await this.connectWebSocket();
        } catch (error) {
            console.warn('WebSocket connection failed, trying SSE fallback:', error);
            this.connectSSE();
        }
    }

    /**
     * Connect via WebSocket
     */
    connectWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                this.websocket = new WebSocket(this.url, this.protocols);
                
                this.websocket.onopen = (event) => {
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    
                    console.log('WebSocket connected');
                    this.emit('connected', { type: 'websocket' });
                    
                    resolve();
                };
                
                this.websocket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
                
                this.websocket.onclose = (event) => {
                    this.handleDisconnection(event);
                };
                
                this.websocket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.emit('error', error);
                    reject(error);
                };
                
                // Connection timeout
                setTimeout(() => {
                    if (!this.isConnected) {
                        this.websocket.close();
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 10000);
                
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    /**
     * Connect via Server-Sent Events (SSE) as fallback
     */
    connectSSE() {
        try {
            const sseUrl = `${window.location.origin}/events`;
            this.eventSource = new EventSource(sseUrl);
            this.useSSE = true;
            
            this.eventSource.onopen = () => {
                this.isConnected = true;
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                
                console.log('SSE connected');
                this.emit('connected', { type: 'sse' });
            };
            
            this.eventSource.onmessage = (event) => {
                this.handleMessage(event.data);
            };
            
            this.eventSource.onerror = (error) => {
                console.error('SSE error:', error);
                this.handleDisconnection();
            };
            
            // Setup specific event listeners for SSE
            ['thing.created', 'thing.updated', 'thing.deleted', 'dashboard.stats', 'system.notification']
                .forEach(eventType => {
                    this.eventSource.addEventListener(eventType, (event) => {
                        this.handleMessage(event.data, eventType);
                    });
                });
                
        } catch (error) {
            console.error('SSE connection failed:', error);
            this.isConnecting = false;
            this.emit('error', error);
        }
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        this.isConnected = false;
        this.stopHeartbeat();
        
        if (this.useSSE && this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.useSSE = false;
        }
        
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        
        console.log('Disconnected from server');
        this.emit('disconnected');
    }

    /**
     * Send message via WebSocket (not available for SSE)
     */
    send(message) {
        if (!this.isConnected) {
            console.warn('Cannot send message: not connected');
            return false;
        }
        
        if (this.useSSE) {
            console.warn('Cannot send message via SSE');
            return false;
        }
        
        try {
            const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
            this.websocket.send(messageStr);
            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            return false;
        }
    }

    /**
     * Handle incoming messages
     */
    handleMessage(data, eventType = null) {
        try {
            const message = typeof data === 'string' ? JSON.parse(data) : data;
            const type = eventType || message.type || 'unknown';
            
            // Emit to specific handlers
            this.emit(type, message.data || message);
            
            // Emit to general message handlers
            this.emit('message', { type, data: message.data || message });
            
        } catch (error) {
            console.error('Failed to parse message:', error, data);
        }
    }

    /**
     * Handle disconnection
     */
    handleDisconnection(event = null) {
        this.isConnected = false;
        this.stopHeartbeat();
        
        if (event && event.code === 1000) {
            // Normal closure
            console.log('WebSocket closed normally');
            this.emit('disconnected', { code: event.code, reason: 'normal' });
            return;
        }
        
        console.log('Connection lost, attempting to reconnect...');
        this.emit('disconnected', { code: event?.code, reason: 'unexpected' });
        
        // Attempt reconnection
        this.attemptReconnection();
    }

    /**
     * Attempt to reconnect
     */
    attemptReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.emit('reconnect.failed');
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect().catch(error => {
                    console.error('Reconnection failed:', error);
                });
            }
        }, this.reconnectInterval * this.reconnectAttempts);
    }

    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        if (this.useSSE) return; // SSE doesn't need heartbeat
        
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.send({ type: 'ping', timestamp: Date.now() });
            }
        }, this.heartbeatInterval);
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Register event handler
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * Remove event handler
     */
    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            const handlers = this.eventHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to handlers
     */
    emit(event, data = null) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('Event handler error:', error);
                }
            });
        }
    }

    /**
     * Handle thing created event
     */
    handleThingCreated(data) {
        console.log('Thing created:', data);
        
        // Update thing manager if available
        if (window.thingManager && data.thing) {
            window.thingManager.things.push(data.thing);
            window.thingManager.applyFiltersAndSort();
            window.thingManager.updateUI();
        }
        
        // Show notification
        if (window.notificationManager) {
            window.notificationManager.show(
                `New thing created: ${data.thing?.thingId || 'Unknown'}`,
                'info',
                'fas fa-plus-circle'
            );
        }
        
        // Update dashboard stats
        this.updateDashboardStats();
    }

    /**
     * Handle thing updated event
     */
    handleThingUpdated(data) {
        console.log('Thing updated:', data);
        
        // Update thing manager if available
        if (window.thingManager && data.thing) {
            const index = window.thingManager.things.findIndex(t => t.thingId === data.thing.thingId);
            if (index !== -1) {
                window.thingManager.things[index] = { ...window.thingManager.things[index], ...data.thing };
                window.thingManager.applyFiltersAndSort();
                window.thingManager.updateUI();
            }
        }
        
        // Show notification
        if (window.notificationManager) {
            window.notificationManager.show(
                `Thing updated: ${data.thing?.thingId || 'Unknown'}`,
                'info',
                'fas fa-edit'
            );
        }
    }

    /**
     * Handle thing deleted event
     */
    handleThingDeleted(data) {
        console.log('Thing deleted:', data);
        
        // Update thing manager if available
        if (window.thingManager && data.thingId) {
            window.thingManager.things = window.thingManager.things.filter(t => t.thingId !== data.thingId);
            window.thingManager.selectedThings.delete(data.thingId);
            window.thingManager.applyFiltersAndSort();
            window.thingManager.updateUI();
        }
        
        // Show notification
        if (window.notificationManager) {
            window.notificationManager.show(
                `Thing deleted: ${data.thingId || 'Unknown'}`,
                'warning',
                'fas fa-trash'
            );
        }
        
        // Update dashboard stats
        this.updateDashboardStats();
    }

    /**
     * Handle dashboard stats update
     */
    handleDashboardStats(data) {
        console.log('Dashboard stats updated:', data);
        
        // Update stat cards
        if (data.stats) {
            Object.keys(data.stats).forEach(key => {
                const element = document.getElementById(`stat-${key}`);
                if (element) {
                    element.textContent = data.stats[key];
                }
            });
        }
        
        // Update charts if available
        if (window.dashboardCharts && data.chartData) {
            window.dashboardCharts.updateCharts(data.chartData);
        }
    }

    /**
     * Handle system notifications
     */
    handleSystemNotification(data) {
        console.log('System notification:', data);
        
        if (window.notificationManager && data.message) {
            window.notificationManager.show(
                data.message,
                data.type || 'info',
                data.icon || null,
                data.duration || null
            );
        }
    }

    /**
     * Update dashboard stats (request from server)
     */
    updateDashboardStats() {
        if (this.isConnected && !this.useSSE) {
            this.send({
                type: 'request.dashboard.stats',
                timestamp: Date.now()
            });
        }
    }

    /**
     * Subscribe to thing updates for specific thing
     */
    subscribeToThing(thingId) {
        if (this.isConnected && !this.useSSE) {
            this.send({
                type: 'subscribe.thing',
                thingId: thingId,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Unsubscribe from thing updates
     */
    unsubscribeFromThing(thingId) {
        if (this.isConnected && !this.useSSE) {
            this.send({
                type: 'unsubscribe.thing',
                thingId: thingId,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            connectionType: this.useSSE ? 'sse' : 'websocket',
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts
        };
    }

    /**
     * Force reconnection
     */
    forceReconnect() {
        this.disconnect();
        this.reconnectAttempts = 0;
        setTimeout(() => this.connect(), 1000);
    }
}

// Connection status indicator
class ConnectionStatusIndicator {
    constructor() {
        this.indicator = null;
        this.statusText = null;
        this.init();
    }

    init() {
        this.createIndicator();
        this.setupEventListeners();
    }

    createIndicator() {
        // Create status indicator if it doesn't exist
        this.indicator = document.getElementById('connection-status');
        if (!this.indicator) {
            this.indicator = document.createElement('div');
            this.indicator.id = 'connection-status';
            this.indicator.className = 'connection-status';
            this.indicator.innerHTML = `
                <div class="status-indicator">
                    <span class="status-dot"></span>
                    <span class="status-text">Connecting...</span>
                </div>
            `;
            
            // Add to header or create floating indicator
            const header = document.querySelector('.header');
            if (header) {
                header.appendChild(this.indicator);
            } else {
                this.indicator.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    z-index: 10000;
                    background: var(--bg-secondary);
                    padding: 8px 12px;
                    border-radius: 4px;
                    box-shadow: var(--shadow);
                    font-size: 0.8rem;
                `;
                document.body.appendChild(this.indicator);
            }
        }
        
        this.statusText = this.indicator.querySelector('.status-text');
    }

    setupEventListeners() {
        if (window.wsClient) {
            window.wsClient.on('connected', (data) => this.updateStatus('connected', data.type));
            window.wsClient.on('disconnected', () => this.updateStatus('disconnected'));
            window.wsClient.on('error', () => this.updateStatus('error'));
        }
    }

    updateStatus(status, connectionType = null) {
        if (!this.indicator) return;
        
        this.indicator.className = `connection-status ${status}`;
        
        const statusMessages = {
            connected: connectionType === 'sse' ? 'Connected (SSE)' : 'Connected',
            disconnected: 'Disconnected',
            error: 'Connection Error',
            connecting: 'Connecting...'
        };
        
        if (this.statusText) {
            this.statusText.textContent = statusMessages[status] || status;
        }
    }
}

// Global instances
window.wsClient = new WebSocketClient();
window.connectionStatus = new ConnectionStatusIndicator();

// Auto-connect when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.wsClient.connect();
});

// Reconnect when page becomes visible (handles browser sleep/wake)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !window.wsClient.isConnected) {
        setTimeout(() => window.wsClient.connect(), 1000);
    }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WebSocketClient, ConnectionStatusIndicator };
}