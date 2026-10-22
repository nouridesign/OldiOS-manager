// src/views/DevicesView.tsx
// Gestion et simulateur d'appareils connectés (iPhone 4 à iPhone 8)

import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Cpu,
  Layers,
  Lock,
  RefreshCw,
  Usb,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { DeviceInfo } from '../types';
import { REFERENCE_DEVICES } from '../data/mockData';
import { compareVersions } from '../services/apiService';

interface Props {
  activeDevice: DeviceInfo;
  onSelectActiveDevice: (device: DeviceInfo) => void;
  onDetectUsb: () => void;
  isDetecting: boolean;
  agentStatusMessage?: string;
}

export const DevicesView: React.FC<Props> = ({
  activeDevice,
  onSelectActiveDevice,
  onDetectUsb,
  isDetecting,
  agentStatusMessage,
}) => {
  // Simulateur de révision iOS personnalisée pour tester l'impact des sauts de version
  const [selectedModel, setSelectedModel] = useState<DeviceInfo>(activeDevice);
  const [customIosVersion, setCustomIosVersion] = useState<string>(activeDevice.productVersion);

  const handleApplyCustomVersion = () => {
    const is32BitAllowed = compareVersions(customIosVersion, '11.0') < 0;
    const updated: DeviceInfo = {
      ...selectedModel,
      productVersion: customIosVersion,
      supports32BitApps: is32BitAllowed,
    };
    setSelectedModel(updated);
    onSelectActiveDevice(updated);
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Appareils connectés & Matrice matérielle
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Détectez votre iPhone via l'agent local USB (lecture seule sécurisée) ou simulez un modèle pour tester sa compatibilité.
          </p>
        </div>

        <button
          onClick={onDetectUsb}
          disabled={isDetecting}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
          <span>{isDetecting ? 'Interrogation USB en cours...' : 'Sonder les ports USB'}</span>
        </button>
      </div>

      {/* Bannière d'état de l'Agent Local */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <Usb className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">
              Agent local macOS (usbmuxd passif)
            </div>
            <div className="text-xs text-slate-500">
              {agentStatusMessage || 'Sonde passive sur 127.0.0.1:27015. Mode simulation actif par défaut.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Lecture seule stricte</span>
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>UDID Masqué</span>
          </span>
        </div>
      </div>

      {/* Simulateur interactif de révision iOS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-slate-700" />
          <span>Simulateur d'appareil actif : {selectedModel.marketingName}</span>
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Modifiez la version iOS exécutée sur ce modèle pour observer immédiatement le basculement des règles architecturales (ex: rupture 32-bit à iOS 11.0).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-6 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Modèle ProductType :</span>
            <div className="font-bold text-slate-800 font-mono mt-0.5">{selectedModel.productType}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">SoC Apple :</span>
            <div className="font-bold text-slate-800 mt-0.5">{selectedModel.soc}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Architecture CPU :</span>
            <div className="font-bold text-slate-800 font-mono mt-0.5">{selectedModel.cpuArchitecture}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Version iOS maximale supportée :</span>
            <div className="font-bold text-slate-800 font-mono mt-0.5">iOS {selectedModel.maxIosVersion}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Version iOS active (ex: 6.1.4, 7.1.2, 9.3.5, 10.3.3, 11.2, 14.8)
            </label>
            <input
              type="text"
              value={customIosVersion}
              onChange={(e) => setCustomIosVersion(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 10.3.3"
            />
          </div>

          <button
            onClick={handleApplyCustomVersion}
            className="mt-auto px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
          >
            Appliquer et définir comme appareil actif
          </button>
        </div>

        {/* Diagnostic immédiat de la version simulée */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Comportement 32-bit déduit :</span>
            {compareVersions(customIosVersion, '11.0') < 0 ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle className="w-3 h-3" />
                <span>Exécution 32-bit autorisée (iOS &lt; 11)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                <AlertTriangle className="w-3 h-3" />
                <span>Exécution 32-bit bloquée par le noyau (iOS 11+)</span>
              </span>
            )}
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            UDID : {selectedModel.udidMasked}
          </div>
        </div>
      </div>

      {/* Matrice de tous les modèles de référence (iPhone 4 à 8) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Matrice des modèles gérés (iPhone 4 à iPhone 8)
          </h2>
          <p className="text-xs text-slate-500">
            Cliquez sur un modèle pour le charger dans le simulateur et tester les scénarios de compatibilité.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REFERENCE_DEVICES.map((dev) => {
            const isCurrent = activeDevice.id === dev.id || activeDevice.productType === dev.productType;

            return (
              <div
                key={dev.id}
                onClick={() => {
                  setSelectedModel(dev);
                  setCustomIosVersion(dev.productVersion);
                  onSelectActiveDevice(dev);
                }}
                className={`bg-white border rounded-xl p-5 shadow-xs cursor-pointer transition-all ${
                  isCurrent
                    ? 'border-blue-600 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{dev.marketingName}</h3>
                      <div className="text-xs font-mono text-slate-400">{dev.productType}</div>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Actif
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Puce SoC :</span>
                    <span className="font-medium">{dev.soc.split('(')[0].trim()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Architecture :</span>
                    <span className="font-mono font-medium">{dev.cpuArchitecture}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plage iOS :</span>
                    <span className="font-mono font-medium">Jusqu'à iOS {dev.maxIosVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Statut 32-bit :</span>
                    <span className="font-medium">
                      {dev.supports32BitApps ? (
                        <span className="text-emerald-700">Supporté</span>
                      ) : (
                        <span className="text-rose-700">Non supporté</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
