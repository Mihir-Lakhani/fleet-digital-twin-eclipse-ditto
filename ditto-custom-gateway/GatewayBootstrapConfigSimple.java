/*
 * Copyright (c) 2024 Digital Twin Platform.
 * Simplified Gateway Bootstrap Configuration
 */
package org.eclipse.ditto.gateway.service.util.config;

/**
 * Configuration interface for Gateway bootstrap behavior.
 */
public interface GatewayBootstrapConfig {
    
    /**
     * Returns whether force-up mode is enabled.
     * 
     * @return true if force-up bootstrap is enabled, false otherwise.
     */
    boolean isForceUpEnabled();
}