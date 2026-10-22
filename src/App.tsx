// src/App.tsx
// OldiOS Manager — Point d'entrée principal de l'application

import React, { useState, useEffect } from 'react';
import { Navigation, NavTab } from './components/Navigation';
import { DeviceBanner } from './components/DeviceBanner';
import { DashboardView } from './views/DashboardView';
import { DevicesView } from './views/DevicesView';
import { SearchView } from './views/SearchView';
import { InstallationCenterView } from './views/InstallationCenterView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { AppDetailModal } from './views/AppDetailModal';
import { CompatibilityReportModal } from './views/CompatibilityReportModal';
import { AppMetadata, AppVersion, DeviceInfo, OperationLog, AgentSettings } from './types';
import { REFERENCE_DEVICES, VINTAGE_CATALOGUE } from './data/mockData';
import { ApiService, DEFAULT_SETTINGS } from './services/apiService';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeDevice, setActiveDevice] = useState<DeviceInfo>(REFERENCE_DEVICES[2]); // iPhone 5 par défaut
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_SETTINGS);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [agentStatusMessage, setAgentStatusMessage] = useState<string>('');

  // Modals
  const [appForDetail, setAppForDetail] = useState<AppMetadata | null>(null);
  const [reportState, setReportState] = useState<{
    app: AppMetadata;
    version: AppVersion;
  } | null>(null);

  // Pré-sélection pour le centre d'installation
  const [installTarget, setInstallTarget] = useState<{
    app: AppMetadata;
    version: AppVersion;
  } | null>(null);

  // Chargement initial
  useEffect(() => {
    const loadedSettings = ApiService.getAgentSettings();
    setSettings(loadedSettings);
    const loadedLogs = ApiService.getOperationLogs();
    setOperationLogs(loadedLogs);
  }, []);

  // Détection USB (sonde agent macOS ou simulation réaliste)
  const handleDetectUsb = async () => {
    setIsDetecting(true);
    const probe = await ApiService.probeLocalAgent(settings);
    setIsDetecting(false);

    if (probe.online && probe.device) {
      setActiveDevice(probe.device);
      setAgentStatusMessage(probe.message);
      addOperationLog({
        type: 'DEVICE_DETECTED',
        deviceName: `${probe.device.marketingName} (${probe.device.productType})`,
        status: 'SUCCESS',
        details: `Appareil physique détecté via USB : iOS ${probe.device.productVersion}, architecture ${probe.device.cpuArchitecture}.`,
      });
    } else {
      setAgentStatusMessage(probe.message);
      addOperationLog({
        type: 'DEVICE_DETECTED',
        deviceName: `${activeDevice.marketingName} (${activeDevice.productType})`,
        status: 'SUCCESS',
        details: `Sonde USB effectuée : ${probe.message}. Maintien du profil matériel de test (${activeDevice.marketingName}).`,
      });
    }
  };

  const addOperationLog = (log: Omit<OperationLog, 'id' | 'timestamp'>) => {
    const created = ApiService.logOperation(log);
    setOperationLogs((prev) => [created, ...prev]);
  };

  const handleClearLogs = () => {
    ApiService.clearOperationLogs();
    setOperationLogs([]);
  };

  const handleSaveSettings = (newSettings: AgentSettings) => {
    setSettings(newSettings);
    ApiService.saveAgentSettings(newSettings);
  };

  const handleSelectAppForDetail = (app: AppMetadata) => {
    setAppForDetail(app);
  };

  const handleSelectVersionForReport = (app: AppMetadata, version: AppVersion) => {
    setReportState({ app, version });
    addOperationLog({
      type: 'COMPATIBILITY_CHECK',
      deviceName: `${activeDevice.marketingName} (${activeDevice.productType})`,
      appName: app.name,
      versionNumber: version.versionNumber,
      status: 'SUCCESS',
      details: `Évaluation de compatibilité demandée pour ${app.name} v${version.versionNumber} sur ${activeDevice.marketingName}.`,
    });
  };

  const handleSelectVersionForInstall = (app: AppMetadata, version: AppVersion) => {
    setAppForDetail(null);
    setReportState(null);
    setInstallTarget({ app, version });
    setActiveTab('installation');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Barre de navigation principale (Top Bar Contract 3 zones) */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeDevice={activeDevice}
        onDetectUsb={handleDetectUsb}
        isDetecting={isDetecting}
      />

      {/* Contenu principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bannière de l'appareil actif */}
        <DeviceBanner
          device={activeDevice}
          onOpenDevicesModal={() => setActiveTab('devices')}
        />

        {/* Vues selon l'onglet actif */}
        {activeTab === 'dashboard' && (
          <DashboardView
            activeDevice={activeDevice}
            onSelectApp={handleSelectAppForDetail}
            onNavigateTab={setActiveTab}
            operationLogs={operationLogs}
          />
        )}

        {activeTab === 'devices' && (
          <DevicesView
            activeDevice={activeDevice}
            onSelectActiveDevice={(dev) => {
              setActiveDevice(dev);
              addOperationLog({
                type: 'DEVICE_DETECTED',
                deviceName: `${dev.marketingName} (${dev.productType})`,
                status: 'SUCCESS',
                details: `Sélection de l'appareil actif : ${dev.marketingName} sous iOS ${dev.productVersion} (${dev.cpuArchitecture}).`,
              });
            }}
            onDetectUsb={handleDetectUsb}
            isDetecting={isDetecting}
            agentStatusMessage={agentStatusMessage}
          />
        )}

        {activeTab === 'search' && (
          <SearchView
            activeDevice={activeDevice}
            onSelectApp={handleSelectAppForDetail}
            countryCode={settings.countryCode}
            onCountryChange={(newCode) => {
              const updated = { ...settings, countryCode: newCode };
              handleSaveSettings(updated);
            }}
          />
        )}

        {activeTab === 'installation' && (
          <InstallationCenterView
            activeDevice={activeDevice}
            selectedApp={installTarget?.app}
            selectedVersion={installTarget?.version}
            onClearSelection={() => setInstallTarget(null)}
            onSelectAppAndVersion={(app, version) => setInstallTarget({ app, version })}
            onLogOperation={addOperationLog}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            logs={operationLogs}
            onClearLogs={handleClearLogs}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onLogOperation={addOperationLog}
          />
        )}
      </main>

      {/* Modals contextuelles */}
      {appForDetail && (
        <AppDetailModal
          app={appForDetail}
          activeDevice={activeDevice}
          onClose={() => setAppForDetail(null)}
          onSelectVersionForReport={handleSelectVersionForReport}
          onSelectVersionForInstall={handleSelectVersionForInstall}
        />
      )}

      {reportState && (
        <CompatibilityReportModal
          app={reportState.app}
          version={reportState.version}
          device={activeDevice}
          onClose={() => setReportState(null)}
          onProceedToInstall={handleSelectVersionForInstall}
        />
      )}

      {/* Footer sobre anti-slop */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">OldiOS Manager</span>
            <span>·</span>
            <span>Préservation & Diagnostic d'Applications Vintage iOS (iPhone 4 à iPhone 8)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Architecture libimobiledevice / usbmuxd</span>
            <span>·</span>
            <span>Contrôles de signatures conformes</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
