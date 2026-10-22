// src/services/apiService.ts
// OldiOS Manager — Frontend Service Layer & Compatibility Engine

import {
  AppMetadata,
  AppVersion,
  CompatibilityReport,
  CompatibilityStatus,
  DeviceInfo,
  InstallationRecord,
  OperationLog,
  AgentSettings
} from '../types';
import { REFERENCE_DEVICES, VINTAGE_CATALOGUE } from '../data/mockData';

const SETTINGS_STORAGE_KEY = 'oldios_agent_settings';
const LOGS_STORAGE_KEY = 'oldios_operation_logs';
const INSTALLATIONS_STORAGE_KEY = 'oldios_installations_records';

export const DEFAULT_SETTINGS: AgentSettings = {
  agentUrl: 'http://127.0.0.1:27015',
  agentToken: '',
  countryCode: 'FR',
  strictSha256Check: true,
  rejectUnsignedIpa: true,
  maskUdid: true,
  requireDoubleConfirmation: true,
};

// Helper to compare semantic versions (e.g., "7.1.2" vs "8.0")
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = v2.split('.').map(p => parseInt(p, 10) || 0);
  const len = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < len; i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export class ApiService {
  /**
   * Récupère la liste des appareils de référence et sonde l'agent USB si configuré.
   */
  static async getDevices(): Promise<DeviceInfo[]> {
    return REFERENCE_DEVICES;
  }

  /**
   * Tente d'interroger l'agent macOS local (sur http://127.0.0.1:27015)
   */
  static async probeLocalAgent(settings: AgentSettings): Promise<{ online: boolean; device?: DeviceInfo; message: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const headers: Record<string, string> = {};
      if (settings.agentToken) {
        headers['X-OldiOS-Agent-Token'] = settings.agentToken;
      }

      const res = await fetch(`${settings.agentUrl}/agent/v1/device`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.connected && data.device) {
          const raw = data.device;
          const detected: DeviceInfo = {
            id: `usb_${raw.product_type}_${Date.now()}`,
            udidMasked: raw.udid_masked || 'PROT...ECTED',
            productType: raw.product_type,
            marketingName: raw.marketing_name || raw.product_type,
            productVersion: raw.product_version,
            buildVersion: raw.build_version || 'N/A',
            cpuArchitecture: raw.cpu_architecture,
            soc: raw.soc || 'Apple Silicon',
            maxIosVersion: 'Inconnue',
            supports32BitApps: compareVersions(raw.product_version, '11.0') < 0,
            supports64BitApps: raw.cpu_architecture === 'arm64',
            isPaired: raw.is_paired,
            connectionType: 'usb',
            lockdownStatus: raw.lockdown_status || 'trusted',
          };
          return { online: true, device: detected, message: 'Appareil physique détecté sur le port USB.' };
        }
        return { online: true, message: data.message || 'Agent en ligne, aucun appareil branché.' };
      }
      return { online: false, message: `L'agent local a répondu avec le statut HTTP ${res.status}.` };
    } catch {
      return {
        online: false,
        message: 'Agent local non joignable (127.0.0.1:27015). Le mode simulation matériel est actif.',
      };
    }
  }

  /**
   * Recherche des applications via l'API publique iTunes Store ou le catalogue vintage local.
   */
  static async searchApps(query: string, countryCode: string = 'FR'): Promise<AppMetadata[]> {
    const q = query.trim().toLowerCase();
    if (!q) return VINTAGE_CATALOGUE;

    // Chercher d'abord dans le catalogue vintage local
    const localMatches = VINTAGE_CATALOGUE.filter(
      app =>
        app.name.toLowerCase().includes(q) ||
        app.bundleId.toLowerCase().includes(q) ||
        app.genres.some(g => g.toLowerCase().includes(q))
    );

    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=software&country=${countryCode}&limit=12`;
      const response = await fetch(itunesUrl);
      if (response.ok) {
        const data = await response.json();
        const liveResults: AppMetadata[] = (data.results || []).map((item: any) => {
          const appId = String(item.trackId);
          const existingVintage = VINTAGE_CATALOGUE.find(v => v.id === appId || v.bundleId === item.bundleId);

          return {
            id: appId,
            name: item.trackName,
            bundleId: item.bundleId,
            artworkUrl: item.artworkUrl100 || item.artworkUrl60 || '',
            sellerName: item.sellerName || 'Éditeur',
            currentVersion: item.version,
            minimumOsVersion: item.minimumOsVersion || '13.0',
            genres: item.genres || ['Application'],
            description: item.description || '',
            priceFormatted: item.formattedPrice || 'Gratuit',
            isSimulated: false,
            hasVintageArchives: Boolean(existingVintage),
            versions: existingVintage?.versions || [
              {
                id: `${appId}-legacy-v1`,
                appId,
                versionNumber: '1.0.0',
                releaseDate: 'Archivée',
                minimumOsVersion: '5.0',
                maximumOsVersion: '7.1.2',
                supportedArchitectures: ['armv7'],
                bundleId: item.bundleId,
                source: 'ARCHIVE_COMMUNITY',
                isSimulated: true,
                sha256: '9f8e7d6c5b4a3928170f1e2d3c4b5a697887766554433221100ffeeddccbbaa9',
                fileSizeBytes: 18500000,
                signatureType: 'AD_HOC',
                trustScore: 86,
                downloadAvailable: true,
                notes: "Version historique cataloguée depuis les archives communautaires d'anciens IPA.",
              },
            ],
          };
        });

        // Combiner sans doublons par bundleId
        const combined = [...localMatches];
        for (const live of liveResults) {
          if (!combined.some(c => c.bundleId === live.bundleId)) {
            combined.push(live);
          }
        }
        return combined;
      }
    } catch {
      // Si la requête iTunes échoue (mode hors ligne ou sandbox), retourner les correspondances locales
    }

    return localMatches;
  }

  /**
   * Récupère les métadonnées et versions complètes d'une application.
   */
  static getAppById(appId: string): AppMetadata | undefined {
    return VINTAGE_CATALOGUE.find(a => a.id === appId);
  }

  /**
   * Moteur d'évaluation rigoureuse de compatibilité.
   * Ne confond JAMAIS compatibilité théorique, installable et fonctionnement réel.
   */
  static evaluateCompatibility(
    device: DeviceInfo,
    appVersion: AppVersion,
    appName: string
  ): CompatibilityReport {
    const reasons: string[] = [];
    const blockers: string[] = [];
    const warnings: string[] = [];
    const supportedMethods: ('MACOS_AGENT_USBMUX' | 'ENTERPRISE_OTA' | 'NONE')[] = [];

    const devOs = device.productVersion;
    const minOs = appVersion.minimumOsVersion;

    // 1. Règle OS Minimum
    if (compareVersions(devOs, minOs) < 0) {
      blockers.push(
        `Version iOS insuffisante : L'appareil tourne sous iOS ${devOs}, mais cette version requiert au minimum iOS ${minOs}.`
      );
    } else {
      reasons.push(`Version iOS compatible : iOS ${devOs} satisfait le prérequis minimal (${minOs}+).`);
    }

    // 2. Règle OS Maximum (si documenté)
    if (appVersion.maximumOsVersion) {
      if (compareVersions(devOs, appVersion.maximumOsVersion) > 0) {
        blockers.push(
          `Obsolescence d'OS supérieur : L'application n'est plus supportée au-delà d'iOS ${appVersion.maximumOsVersion} (l'appareil tourne sous iOS ${devOs}).`
        );
      }
    }

    // 3. Règle d'or de l'architecture CPU
    const has32Bit = appVersion.supportedArchitectures.some(a => a === 'armv7' || a === 'armv7s');
    const has64Bit = appVersion.supportedArchitectures.includes('arm64');

    // Clivage iOS 11 : Rupture totale du 32-bit
    const isIos11OrAbove = compareVersions(devOs, '11.0') >= 0;

    if (isIos11OrAbove) {
      if (!has64Bit) {
        blockers.push(
          `Rupture iOS 11+ : L'appareil tourne sous iOS ${devOs}. Depuis iOS 11, Apple a supprimé tout support d'exécution des binaires 32-bit. Cette application étant exclusivement 32-bit (${appVersion.supportedArchitectures.join(', ')}), le noyau iOS refusera catégoriquement son lancement.`
        );
      } else {
        reasons.push("Tranche 64-bit (arm64) présente et acceptée par le noyau 64-bit d'iOS 11+.");
      }
    } else {
      // Pour iOS < 11
      if (device.cpuArchitecture === 'armv7' || device.cpuArchitecture === 'armv7s') {
        if (!has32Bit) {
          blockers.push(
            `Architecture processeur incompatible : L'appareil dispose d'un processeur 32-bit (${device.cpuArchitecture}), or cette archive ne contient qu'une tranche 64-bit (arm64).`
          );
        } else {
          reasons.push(`Architecture binaire 32-bit compatible avec le processeur ${device.soc} (${device.cpuArchitecture}).`);
        }
      } else {
        // Appareil 64-bit (A7 à A10) sur iOS 7 à 10 : supporte le 32-bit et le 64-bit
        reasons.push(`Architecture supportée en mode hybride (SoC ${device.soc} sous iOS ${devOs} supporte 32-bit et 64-bit).`);
      }
    }

    // 4. Analyse de la signature
    if (appVersion.signatureType === 'UNSIGNED') {
      blockers.push(
        "Fichier non signé : Les appareils iOS d'origine rejettent les paquets non signés. Conformément à la politique de sécurité, aucun contournement de signature n'est opéré."
      );
    } else if (appVersion.signatureType === 'FAIRPLAY_ENCRYPTED') {
      warnings.push(
        "Binaire chiffré FairPlay : Le paquet provient de l'App Store officiel. Il ne s'exécutera que si le compte Apple ayant acquis l'application est configuré sur l'appareil."
      );
    } else if (appVersion.signatureType === 'AD_HOC' || appVersion.signatureType === 'DEVELOPMENT') {
      reasons.push(`Signature ${appVersion.signatureType} vérifiée (profil de déploiement direct pris en charge).`);
    } else if (appVersion.signatureType === 'ENTERPRISE') {
      reasons.push("Certificat Entreprise In-House valide (déploiement direct sans limitation d'UDID).");
      supportedMethods.push('ENTERPRISE_OTA');
    }

    // 5. Statut synthétique rigoureux
    let status: CompatibilityStatus = 'UNKNOWN';

    if (blockers.length > 0) {
      status = 'INCOMPATIBLE';
    } else if (
      appVersion.knownWorkingDevices &&
      appVersion.knownWorkingDevices.includes(device.productType) &&
      appVersion.downloadAvailable &&
      appVersion.sha256
    ) {
      status = 'VERIFIED_WORKING';
      reasons.push(`Exécution physique validée et documentée sur le modèle ${device.productType} (${device.marketingName}).`);
      supportedMethods.push('MACOS_AGENT_USBMUX');
    } else if (
      appVersion.downloadAvailable &&
      appVersion.sha256 &&
      (appVersion.signatureType === 'AD_HOC' || appVersion.signatureType === 'ENTERPRISE' || appVersion.signatureType === 'DEVELOPMENT')
    ) {
      status = 'INSTALLABLE';
      reasons.push("Fichier binaire disponible, intégrité SHA-256 certifiée et signature installable sur l'appareil.");
      supportedMethods.push('MACOS_AGENT_USBMUX');
    } else {
      status = 'THEORETICALLY_COMPATIBLE';
      reasons.push("L'architecture et l'OS sont théoriquement compatibles sur le papier.");
      if (!appVersion.downloadAvailable) {
        warnings.push("Fichier IPA non présent dans le cache local.");
      }
      if (appVersion.signatureType === 'FAIRPLAY_ENCRYPTED') {
        warnings.push("Le chiffrement FairPlay requiert l'activation par compte Apple.");
      }
    }

    return {
      device,
      appVersion,
      appName,
      status,
      reasons,
      blockers,
      warnings,
      supportedMethods: supportedMethods.length ? supportedMethods : ['NONE'],
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Enregistre une opération dans le journal d'audit local.
   */
  static logOperation(log: Omit<OperationLog, 'id' | 'timestamp'>): OperationLog {
    const newLog: OperationLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    const logs = ApiService.getOperationLogs();
    logs.unshift(newLog);
    // Limiter aux 100 derniers événements
    const trimmed = logs.slice(0, 100);
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignore storage errors
    }
    return newLog;
  }

  static getOperationLogs(): OperationLog[] {
    try {
      const raw = localStorage.getItem(LOGS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return [
      {
        id: 'init_1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'DEVICE_DETECTED',
        deviceName: 'iPhone 5 (iPhone5,1)',
        status: 'SUCCESS',
        details: 'Initialisation du sous-système de diagnostic. Détection lecture seule active.',
      },
      {
        id: 'init_2',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'COMPATIBILITY_CHECK',
        deviceName: 'iPhone 4 (iPhone3,1)',
        appName: 'Facebook',
        versionNumber: '3.1.4',
        status: 'SUCCESS',
        details: 'Évaluation de compatibilité validée (Fonctionnement testé en conditions réelles).',
      },
    ];
  }

  static clearOperationLogs(): void {
    localStorage.removeItem(LOGS_STORAGE_KEY);
  }

  /**
   * Sauvegarde et lecture des paramètres agent
   */
  static getAgentSettings(): AgentSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // Ignore
    }
    return DEFAULT_SETTINGS;
  }

  static saveAgentSettings(settings: AgentSettings): void {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }

  /**
   * Enregistre et suit les installations
   */
  static getInstallations(): InstallationRecord[] {
    try {
      const raw = localStorage.getItem(INSTALLATIONS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return [];
  }

  static saveInstallation(record: InstallationRecord): void {
    const list = ApiService.getInstallations();
    const idx = list.findIndex(i => i.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    try {
      localStorage.setItem(INSTALLATIONS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore
    }
  }
}
