# Custom Eclipse Ditto Gateway with Force-Up Bootstrap

This is a custom fork of Eclipse Ditto Gateway that implements a `ditto.gateway.bootstrap.force-up` configuration flag to force the cluster member into "Up" state immediately at startup, bypassing the requirement for a second contact point.

## Purpose

The standard Eclipse Ditto Gateway waits for cluster member synchronization before binding the HTTP API. In single-node deployments or when immediate API access is required, this creates a chicken-and-egg problem where the Gateway cannot serve HTTP requests until cluster bootstrap completes.

## Solution

This custom Gateway implementation adds a new configuration option:

```hocon
ditto {
  gateway {
    bootstrap {
      force-up = true  # Forces immediate cluster "Up" state
    }
  }
}
```

When `force-up = true`, the Gateway will:
1. Mark itself as "Up" immediately during startup
2. Bind the HTTP API without waiting for cluster synchronization
3. Enable full Ditto HTTP API access from service start

## Files Modified

- `DittoGatewayConfig.java` - Added bootstrap configuration support
- `GatewayBootstrapConfig.java` - New configuration class for bootstrap settings
- `DittoService.java` - Modified startup sequence to check force-up flag
- `gateway.conf` - Default configuration with force-up option

## Build Instructions

1. Build the custom Gateway image:
```bash
docker build -t eclipse/ditto-gateway-custom:3.5.0 .
```

2. Update docker-compose to use custom image:
```yaml
ditto-gateway:
  image: eclipse/ditto-gateway-custom:3.5.0
  environment:
    - DITTO_GATEWAY_BOOTSTRAP_FORCE_UP=true
```

## Integration

This custom Gateway maintains full compatibility with the existing Ditto ecosystem while providing immediate HTTP API access for development and single-node deployments.