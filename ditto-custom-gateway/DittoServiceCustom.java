/*
 * Copyright (c) 2017 Contributors to the Eclipse Foundation
 *
 * Custom implementation of DittoService with Force-Up Bootstrap
 * 
 * This implementation adds support for immediate cluster "Up" state
 * to enable HTTP API binding without waiting for cluster synchronization.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
package org.eclipse.ditto.base.service;

import static org.eclipse.ditto.base.model.common.ConditionChecker.argumentNotEmpty;
import static org.eclipse.ditto.base.model.common.ConditionChecker.checkNotNull;

import java.lang.management.ManagementFactory;
import java.text.MessageFormat;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;

import javax.annotation.Nullable;
import javax.annotation.concurrent.NotThreadSafe;

import org.apache.pekko.Done;
import org.apache.pekko.actor.ActorRef;
import org.apache.pekko.actor.ActorSystem;
import org.apache.pekko.actor.CoordinatedShutdown;
import org.apache.pekko.actor.Props;
import org.apache.pekko.cluster.Cluster;
import org.apache.pekko.cluster.pubsub.DistributedPubSub;
import org.apache.pekko.http.javadsl.Http;
import org.apache.pekko.http.javadsl.model.Uri;
import org.apache.pekko.management.cluster.bootstrap.ClusterBootstrap;
import org.apache.pekko.management.javadsl.PekkoManagement;
import org.eclipse.ditto.base.model.common.DittoSystemProperties;
import org.eclipse.ditto.base.model.signals.FeatureToggle;
import org.eclipse.ditto.base.service.config.ServiceSpecificConfig;
import org.eclipse.ditto.base.service.devops.DevOpsCommandsActor;
import org.eclipse.ditto.base.service.devops.LogbackLoggingFacade;
import org.eclipse.ditto.internal.utils.config.DefaultScopedConfig;
import org.eclipse.ditto.internal.utils.config.DittoConfigError;
import org.eclipse.ditto.internal.utils.config.InstanceIdentifierSupplier;
import org.eclipse.ditto.internal.utils.config.ScopedConfig;
import org.eclipse.ditto.internal.utils.config.raw.RawConfigSupplier;
import org.eclipse.ditto.internal.utils.health.status.StatusSupplierActor;
import org.eclipse.ditto.internal.utils.metrics.config.MetricsConfig;
import org.eclipse.ditto.internal.utils.metrics.service.prometheus.PrometheusReporterRoute;
import org.eclipse.ditto.internal.utils.tracing.DittoTracing;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.typesafe.config.Config;
import com.typesafe.config.ConfigException;
import com.typesafe.config.ConfigFactory;
import com.typesafe.config.ConfigRenderOptions;
import com.typesafe.config.ConfigValue;
import com.typesafe.config.ConfigValueFactory;

import ch.qos.logback.classic.LoggerContext;
import kamon.Kamon;
import kamon.prometheus.PrometheusReporter;

/**
 * Custom DittoService implementation with Force-Up bootstrap support.
 * 
 * This implementation checks for the force-up configuration and immediately
 * marks the cluster member as "Up" when enabled, bypassing cluster synchronization.
 */
@NotThreadSafe
public abstract class DittoServiceCustom<C extends ServiceSpecificConfig> {

    public static final String CLUSTER_NAME = "ditto-cluster";
    public static final String DITTO_CONFIG_PATH = ScopedConfig.DITTO_SCOPE;
    protected static final String MONGO_URI_CONFIG_PATH = "pekko.contrib.persistence.mongodb.mongo.mongouri";

    protected final Config rawConfig;
    protected final C serviceSpecificConfig;
    private final Logger logger;
    private final String serviceName;
    private final String rootActorName;

    @Nullable
    private PrometheusReporter prometheusReporter;

    protected DittoServiceCustom(final Logger logger, final String serviceName, final String rootActorName) {
        this.logger = checkNotNull(logger, "logger");
        this.serviceName = argumentNotEmpty(serviceName, "service name");
        this.rootActorName = argumentNotEmpty(rootActorName, "root actor name");
        rawConfig = determineRawConfig();
        serviceSpecificConfig = getServiceSpecificConfig(tryToGetDittoConfigOrEmpty(rawConfig));
        logger.debug("Using service specific config: <{}>.", serviceSpecificConfig);
    }

    public ActorSystem start() {
        return MainMethodExceptionHandler.getInstance(logger).call(this::doStart);
    }

    private Config determineRawConfig() {
        final var loadedConfig = RawConfigSupplier.of(serviceName).get();
        if (logger.isDebugEnabled()) {
            logger.debug("Using config <{}>", loadedConfig.root().render(ConfigRenderOptions.concise()));
        }
        return loadedConfig;
    }

    private Config appendDittoInfo(final Config config) {
        final String instanceId = InstanceIdentifierSupplier.getInstance().get();
        final ConfigValue service = ConfigFactory.empty()
                .withValue("name", ConfigValueFactory.fromAnyRef(serviceName))
                .withValue("instance-id", ConfigValueFactory.fromAnyRef(instanceId))
                .root();
        final ConfigValue vmArgs = ConfigValueFactory.fromIterable(ManagementFactory.getRuntimeMXBean().getInputArguments());
        final ConfigValue env = ConfigValueFactory.fromMap(System.getenv());

        return config.withValue("ditto.info",
                ConfigFactory.empty()
                        .withValue("service", service)
                        .withValue("vm-args", vmArgs)
                        .withValue("env", env)
                        .root());
    }

    private static ScopedConfig tryToGetDittoConfigOrEmpty(final Config rawConfig) {
        try {
            return getDittoConfigOrEmpty(rawConfig);
        } catch (final ConfigException.WrongType e) {
            final var msgPattern = "Value at <{0}> was not of type Config!";
            throw new DittoConfigError(MessageFormat.format(msgPattern, DITTO_CONFIG_PATH), e);
        }
    }

    private static ScopedConfig getDittoConfigOrEmpty(final Config rawConfig) {
        if (rawConfig.hasPath(DITTO_CONFIG_PATH)) {
            return DefaultScopedConfig.dittoScoped(rawConfig);
        }
        return DefaultScopedConfig.empty(DITTO_CONFIG_PATH);
    }

    protected abstract C getServiceSpecificConfig(ScopedConfig dittoConfig);

    private ActorSystem doStart() {
        logRuntimeParameters();
        final var actorSystemConfig = appendDittoInfo(appendPekkoPersistenceMongoUriToRawConfig());
        injectSystemPropertiesLimits(serviceSpecificConfig);
        startKamon();
        final var actorSystem = createActorSystem(actorSystemConfig);
        initializeActorSystem(actorSystem);
        startKamonPrometheusHttpEndpoint(actorSystem);
        return actorSystem;
    }

    protected Config appendPekkoPersistenceMongoUriToRawConfig() {
        return rawConfig;
    }

    private void logRuntimeParameters() {
        final var bean = ManagementFactory.getRuntimeMXBean();
        logger.info("Running with following runtime parameters: <{}>.", bean.getInputArguments());
        logger.info("Available processors: <{}>.", Runtime.getRuntime().availableProcessors());
    }

    private void startKamon() {
        final var kamonConfig = ConfigFactory.load("kamon");
        Kamon.reconfigure(kamonConfig);
        final var metricsConfig = serviceSpecificConfig.getMetricsConfig();
        final var tracingConfig = serviceSpecificConfig.getTracingConfig();

        if (metricsConfig.isSystemMetricsEnabled() || tracingConfig.isTracingEnabled()) {
            Kamon.init();
        }
        if (metricsConfig.isPrometheusEnabled()) {
            startPrometheusReporter();
        }
        DittoTracing.init(tracingConfig);
    }

    private void startPrometheusReporter() {
        try {
            prometheusReporter = PrometheusReporter.create();
            Kamon.addReporter("prometheus reporter", prometheusReporter);
            logger.info("Successfully added Prometheus reporter to Kamon.");
        } catch (final Exception ex) {
            logger.error("Error while adding Prometheus reporter to Kamon.", ex);
        }
    }

    /**
     * CRITICAL MODIFICATION: Custom cluster initialization with force-up support
     */
    private void initializeActorSystem(final ActorSystem actorSystem) {
        startPekkoManagement(actorSystem);
        startClusterBootstrap(actorSystem);

        startStatusSupplierActor(actorSystem);
        startDevOpsCommandsActor(actorSystem);
        
        // FORCE-UP LOGIC: Check for force-up flag and start actors immediately if enabled
        if (isForceUpEnabled()) {
            logger.warn("Force-Up mode enabled - Starting Gateway actors immediately without cluster synchronization!");
            startServiceRootActorsImmediate(actorSystem, serviceSpecificConfig);
        } else {
            startServiceRootActors(actorSystem, serviceSpecificConfig);
        }

        setUpCoordinatedShutdown(actorSystem);
    }

    /**
     * Check if force-up mode is enabled via environment variable or configuration
     */
    private boolean isForceUpEnabled() {
        // Check environment variable first
        final String envForceUp = System.getenv("DITTO_GATEWAY_BOOTSTRAP_FORCE_UP");
        if ("true".equalsIgnoreCase(envForceUp)) {
            logger.info("Force-Up enabled via environment variable: DITTO_GATEWAY_BOOTSTRAP_FORCE_UP=true");
            return true;
        }

        // Check configuration path
        try {
            if (rawConfig.hasPath("ditto.gateway.bootstrap.force-up")) {
                final boolean configForceUp = rawConfig.getBoolean("ditto.gateway.bootstrap.force-up");
                if (configForceUp) {
                    logger.info("Force-Up enabled via configuration: ditto.gateway.bootstrap.force-up=true");
                    return true;
                }
            }
        } catch (Exception e) {
            logger.debug("Could not read force-up configuration, defaulting to false: {}", e.getMessage());
        }

        return false;
    }

    /**
     * FORCE-UP IMPLEMENTATION: Start service actors immediately and force cluster "Up" state
     */
    private void startServiceRootActorsImmediate(final ActorSystem actorSystem, final C serviceSpecificConfig) {
        logger.info("FORCE-UP: Starting service actors immediately without waiting for cluster synchronization.");
        
        // Force cluster member to "Up" state
        final Cluster cluster = Cluster.get(actorSystem);
        cluster.join(cluster.selfAddress());
        
        // Give cluster a moment to process the self-join
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        logger.info("FORCE-UP: Cluster member forced to Up state, starting Gateway actors now.");
        
        final ActorRef pubSubMediator = getDistributedPubSubMediatorActor(actorSystem);
        startMainRootActor(actorSystem, getMainRootActorProps(serviceSpecificConfig, pubSubMediator));
        RootActorStarter.get(actorSystem, ScopedConfig.dittoExtension(actorSystem.settings().config())).execute();
    }

    /**
     * Standard cluster startup sequence (original implementation)
     */
    private void startServiceRootActors(final ActorSystem actorSystem, final C serviceSpecificConfig) {
        logger.info("Waiting for member to be up before proceeding with further initialisation.");

        Cluster.get(actorSystem).registerOnMemberUp(() -> {
            logger.info("Member successfully joined the cluster, instantiating remaining actors.");
            final ActorRef pubSubMediator = getDistributedPubSubMediatorActor(actorSystem);
            startMainRootActor(actorSystem, getMainRootActorProps(serviceSpecificConfig, pubSubMediator));
            RootActorStarter.get(actorSystem, ScopedConfig.dittoExtension(actorSystem.settings().config())).execute();
        });
    }

    private void startKamonPrometheusHttpEndpoint(final ActorSystem actorSystem) {
        final var metricsConfig = serviceSpecificConfig.getMetricsConfig();
        if (metricsConfig.isPrometheusEnabled() && null != prometheusReporter) {
            final String prometheusHostname = metricsConfig.getPrometheusHostname();
            final int prometheusPort = metricsConfig.getPrometheusPort();
            final var prometheusReporterRoute = PrometheusReporterRoute
                    .buildPrometheusReporterRoute(prometheusReporter);

            Http.get(actorSystem)
                    .newServerAt(prometheusHostname, prometheusPort)
                    .bindFlow(prometheusReporterRoute.flow(actorSystem))
                    .thenAccept(theBinding -> {
                        theBinding.addToCoordinatedShutdown(Duration.ofSeconds(1), actorSystem);
                        logger.info("Created new server binding for Kamon Prometheus HTTP endpoint.");
                    })
                    .exceptionally(failure -> {
                        logger.error("Kamon Prometheus HTTP endpoint could not be started: {}", failure.getMessage(), failure);
                        logger.error("Terminating ActorSystem!");
                        actorSystem.terminate();
                        return null;
                    });
        }
    }

    private ActorSystem createActorSystem(final Config config) {
        return ActorSystem.create(CLUSTER_NAME, config);
    }

    private void startPekkoManagement(final ActorSystem actorSystem) {
        logger.info("Starting PekkoManagement ...");
        final var pekkoManagement = PekkoManagement.get(actorSystem);
        final CompletionStage<Uri> startPromise = pekkoManagement.start();
        startPromise.whenComplete((uri, throwable) -> {
            if (null != throwable) {
                logger.error("Error during start of PekkoManagement: <{}>!", throwable.getMessage(), throwable);
            } else {
                logger.info("Started PekkoManagement on URI <{}>.", uri);
            }
        });
    }

    private void startClusterBootstrap(final ActorSystem actorSystem) {
        logger.info("Starting ClusterBootstrap ...");
        final var clusterBootstrap = ClusterBootstrap.get(actorSystem);
        clusterBootstrap.start();
    }

    private void startStatusSupplierActor(final ActorSystem actorSystem) {
        startActor(actorSystem, StatusSupplierActor.props(rootActorName), StatusSupplierActor.ACTOR_NAME);
    }

    private ActorRef startActor(final ActorSystem actorSystem, final Props actorProps, final String actorName) {
        logStartingActor(actorName);
        return actorSystem.actorOf(actorProps, actorName);
    }

    private void logStartingActor(final String actorName) {
        logger.info("Starting actor <{}>.", actorName);
    }

    private void startDevOpsCommandsActor(final ActorSystem actorSystem) {
        startActor(actorSystem, DevOpsCommandsActor.props(LogbackLoggingFacade.newInstance(), serviceName,
                InstanceIdentifierSupplier.getInstance().get()), DevOpsCommandsActor.ACTOR_NAME);
    }

    private void injectSystemPropertiesLimits(final C serviceSpecificConfig) {
        final var limitsConfig = serviceSpecificConfig.getLimitsConfig();
        System.setProperty(DittoSystemProperties.DITTO_LIMITS_THINGS_MAX_SIZE_BYTES,
                Long.toString(limitsConfig.getThingsMaxSize()));
        System.setProperty(DittoSystemProperties.DITTO_LIMITS_POLICIES_MAX_SIZE_BYTES,
                Long.toString(limitsConfig.getPoliciesMaxSize()));
        System.setProperty(DittoSystemProperties.DITTO_LIMITS_MESSAGES_MAX_SIZE_BYTES,
                Long.toString(limitsConfig.getMessagesMaxSize()));
        System.setProperty(FeatureToggle.MERGE_THINGS_ENABLED,
                Boolean.toString(rawConfig.getBoolean(FeatureToggle.MERGE_THINGS_ENABLED)));
        System.setProperty(DittoSystemProperties.DITTO_LIMITS_POLICY_IMPORTS_LIMIT,
                Integer.toString(limitsConfig.getPolicyImportsLimit()));
        final MetricsConfig metricsConfig = serviceSpecificConfig.getMetricsConfig();
        System.setProperty(DittoSystemProperties.DITTO_METRICS_METRIC_PREFIX, metricsConfig.getMetricPrefix());
    }

    private static ActorRef getDistributedPubSubMediatorActor(final ActorSystem actorSystem) {
        return DistributedPubSub.get(actorSystem).mediator();
    }

    protected abstract Props getMainRootActorProps(C serviceSpecificConfig, final ActorRef pubSubMediator);

    private ActorRef startMainRootActor(final ActorSystem actorSystem, final Props mainRootActorProps) {
        return startActor(actorSystem, mainRootActorProps, rootActorName);
    }

    private void setUpCoordinatedShutdown(final ActorSystem actorSystem) {
        final var coordinatedShutdown = CoordinatedShutdown.get(actorSystem);

        coordinatedShutdown.addTask(CoordinatedShutdown.PhaseBeforeServiceUnbind(),
                "log_shutdown_initiation", () -> {
                    logger.info("Initiated coordinated shutdown; gracefully shutting down ...");
                    coordinatedShutdown.getShutdownReason().ifPresent(reason ->
                            logger.info("Shutdown reason was - <{}>", reason));
                    final CompletionStage<Done> stop = PekkoManagement.get(actorSystem).stop();
                    return stop.thenApply(done -> {
                        logger.info("PekkoManagement stopped!");
                        return done;
                    });
                });

        coordinatedShutdown.addTask(CoordinatedShutdown.PhaseActorSystemTerminate(),
                "log_successful_graceful_shutdown", () -> {
                    logger.info("Graceful shutdown completed.");
                    final var loggerContext = (LoggerContext) LoggerFactory.getILoggerFactory();
                    loggerContext.stop();
                    return CompletableFuture.completedFuture(Done.getInstance());
                });
    }
}