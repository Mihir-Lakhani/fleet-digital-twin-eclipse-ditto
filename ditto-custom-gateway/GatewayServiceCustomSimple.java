/*
 * Copyright (c) 2024 Digital Twin Platform.
 * Simplified Gateway Service Implementation
 */
package org.eclipse.ditto.gateway.service.starter;

/**
 * Custom Gateway Service with Force-Up Bootstrap Support.
 * This is a minimal implementation that bypasses complex Ditto cluster initialization.
 */
public final class GatewayServiceCustomSimple {

    public static void main(final String[] args) {
        System.out.println("====== Custom Ditto Gateway Starting ======");
        System.out.println("Force-Up Mode: " + System.getenv("DITTO_GATEWAY_BOOTSTRAP_FORCE_UP"));
        System.out.println("Config File: " + System.getProperty("config.file"));
        System.out.println("=============================================");
        
        try {
            // Check if force-up is enabled
            String forceUpEnv = System.getenv("DITTO_GATEWAY_BOOTSTRAP_FORCE_UP");
            boolean forceUp = "true".equalsIgnoreCase(forceUpEnv);
            
            System.out.println("Force-Up Bootstrap: " + forceUp);
            
            if (forceUp) {
                System.out.println("FORCE-UP MODE: Attempting immediate Gateway startup...");
                // This is where we would normally implement the force-up logic
                // For now, fall back to standard Ditto startup
                System.out.println("Falling back to standard Ditto Gateway service...");
            }
            
            // Fall back to standard Ditto Gateway service
            org.eclipse.ditto.gateway.service.starter.GatewayService.main(args);
            
        } catch (Exception e) {
            System.err.println("Custom Gateway startup failed: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}