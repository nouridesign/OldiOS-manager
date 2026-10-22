// src/views/AppDetailModal.tsx
// Fiche détaillée d'une application et tableau de toutes ses versions documentées

import React from 'react';
import {
  X,
  Shield,
  Layers,
  Download,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Cpu,
  CheckCircle,
} from 'lucide-react';
import { AppMetadata, AppVersion, DeviceInfo } from '../types';
import { ApiService } from '../services/apiService';
import { CompatibilityBadge } from '../components/CompatibilityBadge';

interface Props {
  app: AppMetadata;
  activeDevice: DeviceInfo;
  onClose: () => void;
  onSelectVersionForReport: (app: AppMetadata, version: AppVersion) => void;
  onSelectVersionForInstall: (app: AppMetadata, version: AppVersion) => void;
}

export const AppDetailModal: React.FC<Props> = ({
  app,
  activeDevice,
  onClose,
  onSelectVersionForReport,
  onSelectVersionForInstall,
}) => {
  const versions = app.versions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* En-tête Modal */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <img
              src={app.artworkUrl}
              alt={app.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{app.name}</h2>
                {app.isSimulated ? (
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Archive Historique
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    App Store Officiel
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {app.sellerName} · <span className="font-mono text-slate-400">{app.bundleId}</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 max-w-2xl leading-relaxed">
                {app.description}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rappel de l'appareil actif en haut du tableau */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Évaluation par rapport à l'appareil actif :</span>
            <span className="font-bold text-slate-800">
              {activeDevice.marketingName} (iOS {activeDevice.productVersion} · {activeDevice.cpuArchitecture})
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {versions.length} versions répertoriées
          </span>
        </div>

        {/* Tableau des versions */}
        <div className="p-6 overflow-y-auto space-y-4">
          {versions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-xs">
              Aucune version antérieure n'est actuellement répertoriée pour cette application.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-3">iOS Requis</th>
                    <th className="py-3 px-3">Architectures</th>
                    <th className="py-3 px-3">Signature</th>
                    <th className="py-3 px-3">Confiance</th>
                    <th className="py-3 px-3">Statut avec l'appareil</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {versions.map((ver) => {
                    const report = ApiService.evaluateCompatibility(activeDevice, ver, app.name);

                    return (
                      <tr key={ver.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          v{ver.versionNumber}
                          <div className="text-[11px] font-sans font-normal text-slate-400">
                            {ver.releaseDate}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono">
                          iOS {ver.minimumOsVersion}+
                          {ver.maximumOsVersion && (
                            <div className="text-[11px] text-slate-400">
                              max iOS {ver.maximumOsVersion}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-700">
                          {ver.supportedArchitectures.join(', ')}
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {ver.signatureType}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {ver.source}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono tabular-nums">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{ver.trustScore}%</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ver.downloadAvailable ? 'Binaire présent' : 'Indisponible'}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <CompatibilityBadge status={report.status} size="sm" />
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onSelectVersionForReport(app, ver)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                              title="Afficher le rapport de compatibilité détaillé"
                            >
                              Diagnostic
                            </button>

                            {(report.status === 'INSTALLABLE' || report.status === 'VERIFIED_WORKING') && (
                              <button
                                onClick={() => onSelectVersionForInstall(app, ver)}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                              >
                                Déployer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Note de bas de modal */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-700">Règle de distinction :</span> La compatibilité théorique (sur le papier) valide uniquement la conformité formelle des métadonnées. L'état <span className="font-semibold text-amber-700">Installable</span> exige la validation cryptographique de l'archive (SHA-256) et l'acceptation de la signature. Le <span className="font-semibold text-green-700">Fonctionnement testé</span> garantit l'exécution physique sur appareil réel.
          </div>
        </div>

        {/* Pied de modal */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fermer la fiche
          </button>
        </div>
      </div>
    </div>
  );
};
