// src/views/CompatibilityReportModal.tsx
// Rapport d'évaluation de compatibilité pas-à-pas

import React from 'react';
import {
  X,
  CheckCircle,
  AlertOctagon,
  AlertTriangle,
  Info,
  Smartphone,
  Layers,
  Shield,
  Cpu,
  ArrowRight,
  Download,
} from 'lucide-react';
import { AppMetadata, AppVersion, DeviceInfo } from '../types';
import { ApiService } from '../services/apiService';
import { CompatibilityBadge } from '../components/CompatibilityBadge';

interface Props {
  app: AppMetadata;
  version: AppVersion;
  device: DeviceInfo;
  onClose: () => void;
  onProceedToInstall: (app: AppMetadata, version: AppVersion) => void;
}

export const CompatibilityReportModal: React.FC<Props> = ({
  app,
  version,
  device,
  onClose,
  onProceedToInstall,
}) => {
  const report = ApiService.evaluateCompatibility(device, version, app.name);

  const canInstall = report.status === 'INSTALLABLE' || report.status === 'VERIFIED_WORKING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* En-tête */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Rapport d'évaluation technique
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Diagnostic de compatibilité : {app.name} v{version.versionNumber}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps du diagnostic */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Statut synthétique principal */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1">
                Verdict calculé du moteur de règles :
              </div>
              <CompatibilityBadge status={report.status} size="md" showDescription={true} />
            </div>

            <div className="text-right text-xs text-slate-400 font-mono">
              Évalué le {new Date(report.evaluatedAt).toLocaleTimeString('fr-FR')}
            </div>
          </div>

          {/* Comparatif Appareil vs Archive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Colonne Appareil */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-slate-700" />
                <span>Appareil cible</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Modèle :</span>
                  <span className="font-semibold">{device.marketingName} ({device.productType})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Version iOS :</span>
                  <span className="font-mono font-semibold">iOS {device.productVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Architecture :</span>
                  <span className="font-mono font-semibold">{device.cpuArchitecture} ({device.soc.split('(')[0].trim()})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Prise en charge 32-bit :</span>
                  <span className="font-semibold">
                    {device.supports32BitApps ? (
                      <span className="text-emerald-700">Actif (iOS &lt; 11)</span>
                    ) : (
                      <span className="text-rose-700 font-bold">Bloqué (iOS 11+)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Colonne Application */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-700" />
                <span>Spécifications de la version</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bundle ID :</span>
                  <span className="font-mono truncate max-w-[150px]">{version.bundleId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">OS Minimal Requis :</span>
                  <span className="font-mono font-semibold">iOS {version.minimumOsVersion}+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tranches Binaires :</span>
                  <span className="font-mono font-semibold">{version.supportedArchitectures.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type de Signature :</span>
                  <span className="font-mono font-semibold">{version.signatureType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Décomposition détaillée : Points bloquants, Avertissements et Points validés */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Détail du contrôle technique
            </h3>

            {/* Bloqueurs stricts */}
            {report.blockers.length > 0 && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 space-y-2">
                <div className="font-bold text-rose-900 flex items-center gap-2 text-xs">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Incompatibilités bloquantes ({report.blockers.length})</span>
                </div>
                <ul className="space-y-1.5 pl-6 list-disc text-xs text-rose-800">
                  {report.blockers.map((blocker, i) => (
                    <li key={i} className="leading-relaxed">{blocker}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Avertissements */}
            {report.warnings.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2">
                <div className="font-bold text-amber-900 flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Avertissements et prérequis ({report.warnings.length})</span>
                </div>
                <ul className="space-y-1.5 pl-6 list-disc text-xs text-amber-800">
                  {report.warnings.map((warning, i) => (
                    <li key={i} className="leading-relaxed">{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Critères validés */}
            {report.reasons.length > 0 && (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Critères matériels et logiciels vérifiés ({report.reasons.length})</span>
                </div>
                <ul className="space-y-1.5 pl-6 list-disc text-xs text-emerald-800">
                  {report.reasons.map((reason, i) => (
                    <li key={i} className="leading-relaxed">{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* SHA-256 et Empreinte */}
          {version.sha256 && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <span className="text-slate-400 font-medium">Empreinte cryptographique certifiée SHA-256 :</span>
              <div className="font-mono text-slate-800 break-all select-all mt-1">
                {version.sha256}
              </div>
            </div>
          )}
        </div>

        {/* Pied de modal avec action */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fermer le diagnostic
          </button>

          {canInstall ? (
            <button
              onClick={() => {
                onClose();
                onProceedToInstall(app, version);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <span>Passer au centre d'installation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="text-xs text-rose-600 font-semibold flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4" />
              <span>Installation impossible sur cet appareil</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
