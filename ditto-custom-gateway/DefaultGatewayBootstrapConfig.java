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

import org.eclipse.ditto.internal.utils.config.DittoConfigError;
import org.eclipse.ditto.internal.utils.config.ScopedConfig;

/**
 * Default implementation of {@code GatewayBootstrapConfig}.
 */
@Immutable
public final class DefaultGatewayBootstrapConfig implements GatewayBootstrapConfig {

    private static final String CONFIG_PATH = "bootstrap";

    private final boolean forceUpEnabled;

    private DefaultGatewayBootstrapConfig(final ScopedConfig config) {
        forceUpEnabled = config.getBoolean(ConfigValue.FORCE_UP.getConfigPath());
    }

    /**
     * Returns an instance of {@code DefaultGatewayBootstrapConfig} based on the settings of the
     * specified Config.
     *
     * @param config is supposed to provide the settings of the bootstrap config at the {@code "bootstrap"} config
     * path.
     * @return the instance.
     * @throws DittoConfigError if {@code config} is invalid.
     */
    public static DefaultGatewayBootstrapConfig of(final ScopedConfig config) {
        return new DefaultGatewayBootstrapConfig(
                config.hasPath(CONFIG_PATH) ? config.getConfig(CONFIG_PATH) : config);
    }

    @Override
    public boolean isForceUpEnabled() {
        return forceUpEnabled;
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        final DefaultGatewayBootstrapConfig that = (DefaultGatewayBootstrapConfig) o;
        return forceUpEnabled == that.forceUpEnabled;
    }

    @Override
    public int hashCode() {
        return Boolean.hashCode(forceUpEnabled);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + " [" +
                "forceUpEnabled=" + forceUpEnabled +
                "]";
    }

}