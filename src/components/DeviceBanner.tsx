// src/components/DeviceBanner.tsx
// Active device context banner with technical architectural badges

import React from 'react';
import { Smartphone, Cpu, ShieldCheck, Layers, ChevronRight } from 'lucide-react';
import { DeviceInfo } from '../types';

interface Props {
  device: DeviceInfo;
  onOpenDevicesModal: () => void;
}

export const DeviceBanner: React.FC<Props> = ({ device, onOpenDevicesModal }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Colonne Principale */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-800">
            <Smartphone className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Appareil cible pour les diagnostics
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                {device.productType}
              </span>
              {device.connectionType === 'usb' ? (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  USB Direct
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  Mode Simulation Matérielle
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {device.marketingName}
            </h2>
          </div>
        </div>

        {/* Détails techniques alignés */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Système</div>
              <div className="text-xs font-semibold text-slate-800 font-mono">
                iOS {device.productVersion} ({device.buildVersion})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Architecture</div>
              <div className="text-xs font-semibold text-slate-800 font-mono">
                {device.cpuArchitecture} · {device.soc.split('(')[0].trim()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Support 32-bit</div>
              <div className="text-xs font-semibold font-mono">
                {device.supports32BitApps ? (
                  <span className="text-emerald-700">Actif (iOS &lt; 11)</span>
                ) : (
                  <span className="text-rose-700 font-bold">Bloqué (iOS 11+)</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenDevicesModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap ml-auto md:ml-0"
          >
            <span>Changer d'appareil</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
