// Comprehensive Digital Twin Types
export const DIGITAL_TWIN_TYPES = [
  'Sensor', 'Device', 'Vehicle', 'Building', 'Machine', 'System', 'Person',
  'Environment', 'Equipment', 'Asset', 'Product', 'Process', 'Infrastructure',
  'Animal', 'Plant', 'Material', 'Resource', 'Group', 'Fleet', 'Collection',
  'Building Floor', 'Zone', 'Parking Space', 'Room', 'Parcel', 'Grid'
] as const;

export type DigitalTwinType = typeof DIGITAL_TWIN_TYPES[number];

export interface LocationInfo {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  building?: string;
  room?: string;
}

export interface AssetMetadata {
  manufacturer?: string;
  modelNumber?: string;
  model?: string;
  serialNumber?: string;
  installationDate?: string;
  warrantyExpirationDate?: string;
  firmwareVersion?: string;
  softwareVersion?: string;
  hardwareVersion?: string;
  owner?: string;
  notes?: string;
}

export interface MaintenanceInfo {
  lastMaintenanceDate?: string;
  nextScheduledMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceInterval?: number;
  warrantyEndDate?: string;
  supportContact?: string;
  maintenanceNotes?: string;
}

export interface TelemetryOverview {
  telemetryUrl?: string;
  importantMetrics?: string[];
  dataPoints?: any[];
  sampleRate?: number;
  retentionPeriod?: string;
  alertThresholds?: Record<string, any>;
}

export interface OperationalSettings {
  operatingMode?: 'auto' | 'manual' | 'off';
  safetyLimits?: {
    minTemperature?: number;
    maxTemperature?: number;
    minPressure?: number;
    maxPressure?: number;
    [key: string]: number | undefined;
  };
  reportingInterval?: number;
  energySource?: string;
  powerConsumption?: number;
  operatingTemperatureRange?: string;
  networkProtocol?: string;
  dataFormat?: string;
}

export interface Relationships {
  parentAssetId?: string;
  childAssetIds?: string[];
}

export interface CustomProperty {
  name?: string;
  key?: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean' | 'string';
}

export interface Command {
  id: string;
  name: string;
  description?: string;
  parameters?: { [key: string]: any };
}

export interface PerformanceMetrics {
  uptime?: number;
  errorRate?: number;
  lastResponseTime?: number;
  customMetrics?: { [key: string]: number };
}

export interface DigitalTwin {
  thingId: string;
  policyId: string;
  attributes: {
    // Basic Info
    name: string;
    type: DigitalTwinType;
    status: 'active' | 'inactive' | 'maintenance' | 'error';
    description?: string;
    version?: string;
    
    // Extended attributes
    location?: LocationInfo;
    assetMetadata?: AssetMetadata;
    maintenanceInfo?: MaintenanceInfo;
    telemetryOverview?: TelemetryOverview;
    operationalSettings?: OperationalSettings;
    relationships?: Relationships;
    customProperties?: CustomProperty[];
    commands?: Command[];
    performanceMetrics?: PerformanceMetrics;
    tags?: string[];
  };
  features?: {
    [key: string]: any;
  };
}

export interface CreateTwinRequest {
  // Basic Info
  name: string;
  type: DigitalTwinType;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  description?: string;
  version?: string;
  
  // Extended fields
  location?: LocationInfo;
  assetMetadata?: AssetMetadata;
  maintenanceInfo?: MaintenanceInfo;
  telemetryOverview?: TelemetryOverview;
  operationalSettings?: OperationalSettings;
  relationships?: Relationships;
  customProperties?: CustomProperty[];
  commands?: Command[];
  performanceMetrics?: PerformanceMetrics;
  tags?: string[];
  features?: {
    [key: string]: any;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  totalTwins: number;
  activeTwins: number;
  inactiveTwins: number;
  maintenanceTwins: number;
  errorTwins: number;
}