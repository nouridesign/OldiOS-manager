// src/components/Navigation.tsx
// Top Bar Contract: 3 zones, 1-line wordmark, 5 concise nav links, 1 primary action

import React from 'react';
import { Smartphone, RefreshCw } from 'lucide-react';
import { DeviceInfo } from '../types';

export type NavTab = 'dashboard' | 'devices' | 'search' | 'installation' | 'history' | 'settings';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeDevice: DeviceInfo;
  onDetectUsb: () => void;
  isDetecting: boolean;
}

export const Navigation: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  activeDevice,
  onDetectUsb,
  isDetecting,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single line, no descriptor attached) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            iOS
          </div>
          <button
            onClick={() => onSelectTab('dashboard')}
            className="text-lg font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors whitespace-nowrap"
          >
            OldiOS Manager
          </button>
        </div>

        {/* Zone 2: Navigation links (single-line, concise) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Tableau de bord
          </button>
          <button
            onClick={() => onSelectTab('devices')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'devices'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Appareils connectés
          </button>
          <button
            onClick={() => onSelectTab('search')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'search'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Recherche d'applications
          </button>
          <button
            onClick={() => onSelectTab('installation')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'installation'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Centre d'installation
          </button>
          <button
            onClick={() => onSelectTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'history'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Historique
          </button>
          <button
            onClick={() => onSelectTab('settings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Paramètres
          </button>
        </nav>

        {/* Zone 3: Primary Action & Quick Device Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => onSelectTab('devices')}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs cursor-pointer hover:bg-slate-100 transition-colors"
            title="Appareil actif sélectionné pour les diagnostics"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-800 whitespace-nowrap truncate max-w-[130px]">
              {activeDevice.marketingName}
            </span>
            <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
              v{activeDevice.productVersion}
            </span>
          </div>

          <button
            onClick={onDetectUsb}
            disabled={isDetecting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Sonde en cours...' : 'Sonder USB'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
