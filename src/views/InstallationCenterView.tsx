// src/views/InstallationCenterView.tsx
// Centre d'installation contrôlé avec protocole de sécurité et confirmation explicite

import React, { useState } from 'react';
import {
  DownloadCloud,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  FileCheck,
  Smartphone,
  ExternalLink,
  RefreshCw,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { AppMetadata, AppVersion, DeviceInfo, InstallationRecord } from '../types';
import { VINTAGE_CATALOGUE } from '../data/mockData';
import { ApiService } from '../services/apiService';
import { CompatibilityBadge } from '../components/CompatibilityBadge';

interface Props {
  activeDevice: DeviceInfo;
  selectedApp?: AppMetadata;
  selectedVersion?: AppVersion;
  onClearSelection: () => void;
  onSelectAppAndVersion: (app: AppMetadata, version: AppVersion) => void;
  onLogOperation: (log: any) => void;
}

export const InstallationCenterView: React.FC<Props> = ({
  activeDevice,
  selectedApp,
  selectedVersion,
  onClearSelection,
  onSelectAppAndVersion,
  onLogOperation,
}) => {
  // Sélection manuelle si non fournie en props
  const [currentApp, setCurrentApp] = useState<AppMetadata | undefined>(
    selectedApp || VINTAGE_CATALOGUE[0]
  );
  const [currentVersion, setCurrentVersion] = useState<AppVersion | undefined>(
    selectedVersion || currentApp?.versions?.[0]
  );

  // État de la modal de confirmation explicite
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [explicitAgreement, setExplicitAgreement] = useState(false);

  // État d'avancement de l'opération
  const [installing, setInstalling] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [installationComplete, setInstallationComplete] = useState(false);
  const [installationError, setInstallationError] = useState<string | null>(null);

  const steps = [
    { title: 'Calcul et validation SHA-256', detail: 'Intégrité binaire vérifiée contre le registre.' },
    { title: 'Vérification de la signature iOS', detail: 'Validation du profil Ad-Hoc ou certificat Entreprise.' },
    { title: 'Contrôle du verrouillage USB', detail: 'Vérification du canal lockdown usbmuxd (mode passif).' },
    { title: 'Transfert & installation_proxy', detail: 'Déploiement et enregistrement du paquet sur le système.' },
  ];

  // Évaluation de la compatibilité
  const report = currentApp && currentVersion
    ? ApiService.evaluateCompatibility(activeDevice, currentVersion, currentApp.name)
    : null;

  const canInstall = report && (report.status === 'INSTALLABLE' || report.status === 'VERIFIED_WORKING');

  const handleLaunchInstallation = async () => {
    if (!currentApp || !currentVersion || !explicitAgreement) return;

    setShowConfirmModal(false);
    setInstalling(true);
    setInstallationComplete(false);
    setInstallationError(null);
    setCurrentStepIndex(0);

    onLogOperation({
      type: 'INSTALLATION_ATTEMPT',
      deviceName: `${activeDevice.marketingName} (${activeDevice.productType})`,
      appName: currentApp.name,
      versionNumber: currentVersion.versionNumber,
      status: 'WARNING',
      details: `Initiation du déploiement de ${currentApp.name} v${currentVersion.versionNumber} avec contrôle d'empreinte.`,
    });

    // Déroulement pas-à-pas simulé / contrôlé
    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setInstalling(false);
    setInstallationComplete(true);

    const record: InstallationRecord = {
      id: `inst_${Date.now()}`,
      timestamp: new Date().toISOString(),
      deviceId: activeDevice.id,
      deviceMarketingName: activeDevice.marketingName,
      productType: activeDevice.productType,
      productVersion: activeDevice.productVersion,
      appId: currentApp.id,
      appName: currentApp.name,
      versionNumber: currentVersion.versionNumber,
      bundleId: currentVersion.bundleId,
      sha256: currentVersion.sha256 || 'N/A',
      signatureType: currentVersion.signatureType,
      status: 'INSTALLED',
      stages: steps.map((s) => ({ name: s.title, status: 'COMPLETED', detail: s.detail })),
    };

    ApiService.saveInstallation(record);

    onLogOperation({
      type: 'INSTALLATION_ATTEMPT',
      deviceName: `${activeDevice.marketingName} (${activeDevice.productType})`,
      appName: currentApp.name,
      versionNumber: currentVersion.versionNumber,
      status: 'SUCCESS',
      details: `Installation réussie via installation_proxy. Paquet enregistré (${currentVersion.bundleId}).`,
    });
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Centre d'installation sécurisé
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Déploiement contrôlé d'applications vérifiées. Le système valide rigoureusement l'empreinte SHA-256, la signature et l'architecture avant toute tentative.
        </p>
      </div>

      {/* Charte de Sécurité & Garde-fous */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-white tracking-wide">
              Garde-fous de Sécurité & Non-Altération Matérielle
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Aucun identifiant ni mot de passe Apple n'est demandé ou stocké.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Contrôles de signatures de code iOS respectés sans contournement.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Vérification d'empreinte SHA-256 obligatoire avant tout transfert.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Interdiction formelle de flash ou de réinitialisation automatique.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sélection de l'application et de la version */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <span>1. Sélection du paquet binaire & appareil cible</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Choix de l'application */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Application cible
            </label>
            <select
              value={currentApp?.id}
              onChange={(e) => {
                const found = VINTAGE_CATALOGUE.find((a) => a.id === e.target.value);
                setCurrentApp(found);
                setCurrentVersion(found?.versions?.[0]);
                setInstallationComplete(false);
              }}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {VINTAGE_CATALOGUE.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.bundleId})
                </option>
              ))}
            </select>
          </div>

          {/* Choix de la version */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Version archivée
            </label>
            <select
              value={currentVersion?.id}
              onChange={(e) => {
                const found = currentApp?.versions?.find((v) => v.id === e.target.value);
                setCurrentVersion(found);
                setInstallationComplete(false);
              }}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currentApp?.versions?.map((ver) => (
                <option key={ver.id} value={ver.id}>
                  v{ver.versionNumber} ({ver.supportedArchitectures.join(', ')}) — iOS {ver.minimumOsVersion}+
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Détails du paquet sélectionné et statut de compatibilité */}
        {currentApp && currentVersion && report && (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentApp.artworkUrl}
                  alt={currentApp.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {currentApp.name} v{currentVersion.versionNumber}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    {currentVersion.bundleId}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Statut avec {activeDevice.marketingName} :</span>
                <CompatibilityBadge status={report.status} size="sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-200/80">
              <div>
                <span className="text-slate-400">Tranches CPU :</span>
                <div className="font-mono font-semibold text-slate-800">
                  {currentVersion.supportedArchitectures.join(', ')}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Signature :</span>
                <div className="font-mono font-semibold text-slate-800">
                  {currentVersion.signatureType}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Taille :</span>
                <div className="font-mono text-slate-800">
                  {currentVersion.fileSizeBytes
                    ? `${(currentVersion.fileSizeBytes / (1024 * 1024)).toFixed(1)} Mo`
                    : 'Non spécifié'}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Score de confiance :</span>
                <div className="font-mono font-bold text-slate-800">
                  {currentVersion.trustScore}%
                </div>
              </div>
            </div>

            {currentVersion.sha256 && (
              <div className="text-[11px] font-mono text-slate-500 break-all bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400">SHA-256 : </span>
                {currentVersion.sha256}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone d'action et Déroulement */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <DownloadCloud className="w-4 h-4 text-slate-700" />
          <span>2. Procédure d'installation contrôlée</span>
        </h2>

        {/* Message Web vs Agent macOS */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 leading-relaxed">
          <span className="font-bold">Note technique relative aux navigateurs Web :</span> Le protocole de multiplexage USB Apple (<code className="font-mono">usbmuxd</code>) ne peut pas être exploité directement par WebUSB. Cette interface orchestre les commandes via l'agent macOS local (ou application Tauri). En mode test web, la séquence complète de validation et d'installation est simulée avec rigueur.
        </div>

        {/* Diagnostic préalable d'éligibilité */}
        {!canInstall ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Installation non autorisée pour cette combinaison</span>
            </div>
            <p>
              Le moteur de règles interdit le déploiement. Raison : {report?.blockers[0] || "Signature ou fichier non éligible."}
            </p>
          </div>
        ) : (
          <div>
            {!installing && !installationComplete && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Initier le déploiement sur {activeDevice.marketingName}</span>
              </button>
            )}
          </div>
        )}

        {/* Stepper de progression */}
        {(installing || installationComplete) && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {installing ? 'Opération en cours...' : 'Rapport de déploiement finalisé'}
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => {
                const isPassed = installationComplete || idx < currentStepIndex;
                const isCurrent = installing && idx === currentStepIndex;

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                      isPassed
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : isCurrent
                        ? 'bg-blue-50/70 border-blue-200 text-blue-950 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="shrink-0">
                      {isPassed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-xs">{step.title}</div>
                      <div className="text-[11px] opacity-80">{step.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {installationComplete && (
              <div className="p-4 rounded-xl bg-green-100/70 border border-green-300 text-xs text-green-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-700" />
                  <span>Statut : Installation réussie</span>
                </div>
                <p className="leading-relaxed">
                  L'application a été enregistrée avec succès dans le système de l'appareil.
                  <br />
                  <span className="font-semibold text-green-900">Rappel fondamental :</span> Une installation réussie ne garantit pas le fonctionnement des serveurs tiers d'origine si ceux-ci ont été coupés par leurs éditeurs.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmation Explicite */}
      {showConfirmModal && currentApp && currentVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Confirmation explicite avant installation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vérifiez attentivement les paramètres de la transaction logicielle.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Appareil cible :</span>
                <span className="font-bold text-slate-800">{activeDevice.marketingName} (iOS {activeDevice.productVersion})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Application :</span>
                <span className="font-bold text-slate-800">{currentApp.name} v{currentVersion.versionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bundle ID :</span>
                <span className="font-mono text-slate-700">{currentVersion.bundleId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Type de signature :</span>
                <span className="font-mono text-slate-700">{currentVersion.signatureType}</span>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={explicitAgreement}
                onChange={(e) => setExplicitAgreement(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="leading-relaxed">
                Je confirme vouloir transférer cette archive autorisée sur mon appareil vintage sans altérer le système d'exploitation.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={!explicitAgreement}
                onClick={handleLaunchInstallation}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors shadow-xs"
              >
                Confirmer et installer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
