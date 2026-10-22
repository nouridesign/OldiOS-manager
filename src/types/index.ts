// src/types/index.ts
// OldiOS Manager — Frontend Types

export type CpuArchitecture = 'armv7' | 'armv7s' | 'arm64';

export interface DeviceInfo {
  id: string;
  udidMasked: string;
  productType: string;
  marketingName: string;
  productVersion: string;
  buildVersion: string;
  cpuArchitecture: CpuArchitecture;
  soc: string;
  maxIosVersion: string;
  supports32BitApps: boolean;
  supports64BitApps: boolean;
  isPaired: boolean;
  connectionType: 'usb' | 'network' | 'simulated';
  lockdownStatus: 'trusted' | 'untrusted' | 'locked' | 'unpaired';
}

export type CompatibilityStatus =
  | 'UNKNOWN'
  | 'THEORETICALLY_COMPATIBLE'
  | 'INSTALLABLE'
  | 'INSTALLED'
  | 'VERIFIED_WORKING'
  | 'INCOMPATIBLE';

export type SignatureType =
  | 'FAIRPLAY_ENCRYPTED'
  | 'AD_HOC'
  | 'ENTERPRISE'
  | 'DEVELOPMENT'
  | 'UNSIGNED';

export interface AppVersion {
  id: string;
  appId: string;
  versionNumber: string;
  releaseDate: string;
  minimumOsVersion: string;
  maximumOsVersion?: string;
  supportedArchitectures: CpuArchitecture[];
  bundleId: string;
  source: 'ITUNES_STORE' | 'ARCHIVE_COMMUNITY' | 'LOCAL_CACHE';
  isSimulated: boolean;
  sha256?: string;
  fileSizeBytes?: number;
  signatureType: SignatureType;
  trustScore: number;
  downloadAvailable: boolean;
  notes?: string;
  knownWorkingDevices?: string[];
}

export interface AppMetadata {
  id: string;
  name: string;
  bundleId: string;
  artworkUrl: string;
  sellerName: string;
  currentVersion: string;
  minimumOsVersion: string;
  genres: string[];
  description: string;
  priceFormatted?: string;
  isSimulated: boolean;
  hasVintageArchives?: boolean;
  versions?: AppVersion[];
}

export interface CompatibilityReport {
  device: DeviceInfo;
  appVersion: AppVersion;
  appName: string;
  status: CompatibilityStatus;
  reasons: string[];
  blockers: string[];
  warnings: string[];
  supportedMethods: ('MACOS_AGENT_USBMUX' | 'ENTERPRISE_OTA' | 'NONE')[];
  evaluatedAt: string;
}

export interface InstallationRecord {
  id: string;
  timestamp: string;
  deviceId: string;
  deviceMarketingName: string;
  productType: string;
  productVersion: string;
  appId: string;
  appName: string;
  versionNumber: string;
  bundleId: string;
  sha256: string;
  signatureType: SignatureType;
  status: 'PENDING' | 'VERIFYING' | 'STAGING' | 'DEPLOYING' | 'INSTALLED' | 'FAILED';
  stages: {
    name: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    detail?: string;
  }[];
  errorMessage?: string;
}

export interface OperationLog {
  id: string;
  timestamp: string;
  type: 'DEVICE_DETECTED' | 'COMPATIBILITY_CHECK' | 'SIGNATURE_VERIFY' | 'INSTALLATION_ATTEMPT' | 'SETTINGS_UPDATE';
  deviceName: string;
  appName?: string;
  versionNumber?: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'BLOCKED';
  details: string;
}

export interface AgentSettings {
  agentUrl: string;
  agentToken: string;
  countryCode: string;
  strictSha256Check: boolean;
  rejectUnsignedIpa: boolean;
  maskUdid: boolean;
  requireDoubleConfirmation: boolean;
}
