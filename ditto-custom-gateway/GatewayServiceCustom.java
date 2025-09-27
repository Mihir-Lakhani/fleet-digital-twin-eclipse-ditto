/*
 * Copyright (c) 2017 Contributors to the Eclipse Foundation
 *
 * Custom Gateway Service with Force-Up Bootstrap Support
 * 
 * This implementation extends the custom DittoService to provide
 * immediate HTTP API availability without cluster synchronization.
 */
package org.eclipse.ditto.gateway.service.starter;

import org.eclipse.ditto.base.service.DittoServiceCustom;
import org.eclipse.ditto.gateway.service.util.config.DittoGatewayConfigCustom;
import org.eclipse.ditto.gateway.service.util.config.GatewayConfig;
import org.eclipse.ditto.internal.utils.config.ScopedConfig;
import org.eclipse.ditto.utils.jsr305.annotations.AllParametersAndReturnValuesAreNonnullByDefault;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.apache.pekko.actor.ActorRef;
import org.apache.pekko.actor.Props;

/**
 * The Custom Gateway service for Eclipse Ditto with Force-Up bootstrap support.
 */
@AllParametersAndReturnValuesAreNonnullByDefault
public final class GatewayServiceCustom extends DittoServiceCustom<GatewayConfig> {

    /**
     * Name for the Pekko actor system of the Gateway service.
     */
    public static final String SERVICE_NAME = "gateway";

    private static final Logger LOGGER = LoggerFactory.getLogger(GatewayServiceCustom.class);

    private GatewayServiceCustom() {
        super(LOGGER, SERVICE_NAME, GatewayRootActor.ACTOR_NAME);
    }

    /**
     * Starts the Custom Gateway service with Force-Up support.
     *
     * @param args command line arguments.
     */
    public static void main(final String[] args) {
        final GatewayServiceCustom gatewayService = new GatewayServiceCustom();
        LOGGER.info("Starting Custom Gateway Service with Force-Up Bootstrap Support");
        LOGGER.info("Force-Up Environment Variable: {}", System.getenv("DITTO_GATEWAY_BOOTSTRAP_FORCE_UP"));
        gatewayService.start().getWhenTerminated().toCompletableFuture().join();
    }

    @Override
    protected GatewayConfig getServiceSpecificConfig(final ScopedConfig dittoConfig) {
        return DittoGatewayConfigCustom.of(dittoConfig);
    }

    @Override
    protected Props getMainRootActorProps(final GatewayConfig gatewayConfig, final ActorRef pubSubMediator) {
        return GatewayRootActor.props(gatewayConfig, pubSubMediator);
    }
}