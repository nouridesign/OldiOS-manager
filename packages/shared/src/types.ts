// packages/shared/src/types.ts
// OldiOS Manager — Shared Domain Types

export type CpuArchitecture = 'armv7' | 'armv7s' | 'arm64';

export interface DeviceInfo {
  id: string;
  udidMasked: string; // Ex: "7b4c...9f2a" (UDID never exposed in full)
  productType: string; // Ex: "iPhone5,1"
  marketingName: string; // Ex: "iPhone 5"
  productVersion: string; // Ex: "6.1.4"
  buildVersion: string; // Ex: "10B350"
  cpuArchitecture: CpuArchitecture;
  soc: string; // Ex: "Apple A6"
  maxIosVersion: string; // Ex: "10.3.4"
  supports32BitApps: boolean; // False on iOS 11+
  supports64BitApps: boolean; // True on A7+
  isPaired: boolean;
  connectionType: 'usb' | 'network' | 'simulated';
  lockdownStatus: 'trusted' | 'untrusted' | 'locked' | 'unpaired';
}

export type CompatibilityStatus =
  | 'UNKNOWN'                  // Métadonnées insuffisantes
  | 'THEORETICALLY_COMPATIBLE' // Compatible sur le papier (OS & Arch OK, mais binaire ou signature non finalisés)
  | 'INSTALLABLE'              // Fichier présent + SHA-256 valide + Signature vérifiée pour cet appareil
  | 'INSTALLED'                // Déployé via installation_proxy avec succès
  | 'VERIFIED_WORKING'         // Fonctionnement testé et validé sur appareil réel
  | 'INCOMPATIBLE';            // Rejet catégorique (OS trop vieux, rupture 32-bit, arch manquante)

export type SignatureType =
  | 'FAIRPLAY_ENCRYPTED'       // Binaire chiffré App Store (requiert Apple ID appairé)
  | 'AD_HOC'                   // Signé avec profil Ad-Hoc incluant l'UDID
  | 'ENTERPRISE'               // Certificat d'entreprise In-House
  | 'DEVELOPMENT'              // Certificat développeur Apple
  | 'UNSIGNED';                // Binaire non signé (incompatible sans jailbreak, non supporté)

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
  trustScore: number; // 0 à 100
  downloadAvailable: boolean;
  notes?: string;
  knownWorkingDevices?: string[]; // Ex: ["iPhone3,1", "iPhone5,1"]
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

export interface InstallationPrecheck {
  canProceed: boolean;
  device: DeviceInfo;
  appVersion: AppVersion;
  sha256Verified: boolean;
  signatureValid: boolean;
  iosVersionCompatible: boolean;
  blockers: string[];
  warnings: string[];
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
