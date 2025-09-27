# Custom Eclipse Ditto Gateway with Force-Up Bootstrap
# Comprehensive Java compilation and integration approach

FROM eclipse/ditto-gateway:3.5.0

# Switch to root to install development dependencies
USER root

# Install OpenJDK development tools for compilation
RUN apt-get update && apt-get install -y openjdk-17-jdk && rm -rf /var/lib/apt/lists/*

# Create directory structure for custom code
WORKDIR /opt/ditto/custom

# Copy source files and configuration
COPY GatewayServiceCustomSimple.java /opt/ditto/custom/src/
COPY gateway.conf /opt/ditto/conf/gateway-custom.conf

# Create build directories
RUN mkdir -p /opt/ditto/custom/classes /opt/ditto/custom/lib

# Copy the original Ditto JAR for classpath compilation
RUN cp /opt/ditto/ditto-gateway-service-3.5.0-allinone.jar /opt/ditto/custom/lib/

# Compile custom Java classes with Ditto dependencies
RUN cd /opt/ditto/custom && \
    javac -cp "/opt/ditto/custom/lib/ditto-gateway-service-3.5.0-allinone.jar" \
          -d classes \
          src/*.java && \
    echo "Custom Java classes compiled successfully"

# Create comprehensive startup script
RUN echo '#!/bin/bash' > /opt/ditto/startup-force-up.sh && \
    echo 'echo "==== Starting Custom Ditto Gateway with Force-Up Bootstrap ====="' >> /opt/ditto/startup-force-up.sh && \
    echo 'echo "Force-Up Mode: ${DITTO_GATEWAY_BOOTSTRAP_FORCE_UP:-false}"' >> /opt/ditto/startup-force-up.sh && \
    echo 'echo "Configuration: gateway-custom.conf"' >> /opt/ditto/startup-force-up.sh && \
    echo 'echo "Custom Classes: /opt/ditto/custom/classes"' >> /opt/ditto/startup-force-up.sh && \
    echo 'echo "==============================================================="' >> /opt/ditto/startup-force-up.sh && \
    echo '' >> /opt/ditto/startup-force-up.sh && \
    echo '# Build comprehensive classpath with custom classes first' >> /opt/ditto/startup-force-up.sh && \
    echo 'CUSTOM_CLASSPATH="/opt/ditto/custom/classes:/opt/ditto/ditto-gateway-service-3.5.0-allinone.jar"' >> /opt/ditto/startup-force-up.sh && \
    echo '' >> /opt/ditto/startup-force-up.sh && \
    echo '# Launch custom Gateway service' >> /opt/ditto/startup-force-up.sh && \
    echo 'echo "Launching with classpath: $CUSTOM_CLASSPATH"' >> /opt/ditto/startup-force-up.sh && \
    echo 'echo "Entry Point: org.eclipse.ditto.gateway.service.starter.GatewayServiceCustomSimple"' >> /opt/ditto/startup-force-up.sh && \
    echo 'exec java $JAVA_TOOL_OPTIONS -cp "$CUSTOM_CLASSPATH" \' >> /opt/ditto/startup-force-up.sh && \
    echo '     -Dconfig.file=/opt/ditto/conf/gateway-custom.conf \' >> /opt/ditto/startup-force-up.sh && \
    echo '     org.eclipse.ditto.gateway.service.starter.GatewayServiceCustomSimple' >> /opt/ditto/startup-force-up.sh && \
    chmod +x /opt/ditto/startup-force-up.sh

# Set ownership to ditto user
RUN chown -R ditto:ditto /opt/ditto/custom /opt/ditto/startup-force-up.sh /opt/ditto/conf/gateway-custom.conf

# Set environment variables for force-up bootstrap
ENV DITTO_GATEWAY_BOOTSTRAP_FORCE_UP=true

# Switch back to ditto user for security
USER ditto

# Expose required ports
EXPOSE 8080 8558 2551

# Health check for the Gateway HTTP API
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/status/health || exit 1

# Use the comprehensive custom startup script
CMD ["/opt/ditto/startup-force-up.sh"]