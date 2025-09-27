/*
* Copyright (c) 2019 Contributors to the Eclipse Foundation
*
* See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */
package org.eclipse.ditto.gateway.service.util.config;

import javax.annotation.concurrent.Immutable;

import org.eclipse.ditto.internal.utils.config.KnownConfigValue;

/**
 * Provides configuration settings for Gateway bootstrap behavior.
 * This includes the force-up flag that allows immediate cluster member "Up" state.
 */
@Immutable
public interface GatewayBootstrapConfig {

    /**
     * Returns whether to force the Gateway cluster member into "Up" state immediately
     * without waiting for cluster synchronization.
     *
     * @return {@code true} to force immediate "Up" state, {@code false} to wait for cluster bootstrap.
     */
    boolean isForceUpEnabled();

    /**
     * An enumeration of the known config path expressions and their associated default values for
     * {@code GatewayBootstrapConfig}.
     */
    enum ConfigValue implements KnownConfigValue {

        /**
         * Whether to force the Gateway into cluster "Up" state immediately.
         */
        FORCE_UP("force-up", false);

        private final String path;
        private final Object defaultValue;

        ConfigValue(final String thePath, final Object theDefaultValue) {
            path = thePath;
            defaultValue = theDefaultValue;
        }

        @Override
        public Object getDefaultValue() {
            return defaultValue;
        }

        @Override
        public String getConfigPath() {
            return path;
        }

    }

}