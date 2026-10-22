// src/views/DashboardView.tsx
// Tableau de bord principal — OldiOS Manager

import React from 'react';
import {
  Smartphone,
  Search,
  DownloadCloud,
  Layers,
  ArrowRight,
  Shield,
  Cpu,
  Lock,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { AppMetadata, DeviceInfo, OperationLog } from '../types';
import { VINTAGE_CATALOGUE } from '../data/mockData';
import { CompatibilityBadge } from '../components/CompatibilityBadge';
import { ApiService } from '../services/apiService';

interface Props {
  activeDevice: DeviceInfo;
  onSelectApp: (app: AppMetadata) => void;
  onNavigateTab: (tab: any) => void;
  operationLogs: OperationLog[];
}

export const DashboardView: React.FC<Props> = ({
  activeDevice,
  onSelectApp,
  onNavigateTab,
  operationLogs,
}) => {
  return (
    <div className="space-y-8">
      {/* En-tête éditorial */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Tableau de bord de préservation
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Plateforme d'ingénierie logicielle pour le diagnostic, l'évaluation de compatibilité et l'installation vérifiée d'applications sur iPhone 4 à iPhone 8.
        </p>
      </div>

      {/* KPI / Metrics strip — 4 colonnes régulières */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Modèles Pris en Charge
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            9 modèles
          </div>
          <div className="text-xs text-slate-500 mt-1">
            iPhone 4 (A4) à iPhone 8 (A11)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Archives Documentées
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {VINTAGE_CATALOGUE.reduce((acc, curr) => acc + (curr.versions?.length || 0), 0)} versions
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Avec tranches armv7, v7s & arm64
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Opérations Auditées
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {operationLogs.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Tracées avec horodatage strict
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Mode de Connexion
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {activeDevice.connectionType === 'usb' ? 'USB Passif' : 'Simulateur'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Lockdown: {activeDevice.lockdownStatus}
          </div>
        </div>
      </div>

      {/* Règles Fondamentales & Réalités Physiques */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <span>Principes & Invariants de Compatibilité (iPhone 4 à 8)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-amber-600" />
              <span>Rupture 32-bit (iOS 11)</span>
            </div>
            <p className="leading-relaxed">
              Dès iOS 11, Apple a supprimé les bibliothèques d'exécution 32-bit. Un exécutable <code className="font-mono text-slate-800">armv7</code> refuse catégoriquement de se lancer sur iOS 11+, même sur processeur 64-bit.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>FairPlay DRM vs Ad-Hoc</span>
            </div>
            <p className="leading-relaxed">
              Les IPAs officiels du store sont chiffrés par FairPlay et nécessitent le compte Apple d'origine sur l'appareil. Les archives Ad-Hoc ou Entreprise s'installent directement sans contournement de sécurité.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Intégrité Cryptographique SHA-256</span>
            </div>
            <p className="leading-relaxed">
              Chaque archive est vérifiée par empreinte SHA-256 avant tout transfert via <code className="font-mono text-slate-800">installation_proxy</code>. Aucun mot de passe Apple n'est requis ni stocké.
            </p>
          </div>
        </div>
      </section>

      {/* Applications Vintage en Vedette */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Applications Vintage Cataloguées
            </h2>
            <p className="text-xs text-slate-500">
              Évaluez la compatibilité théorique et réelle avec l'appareil actif ({activeDevice.marketingName})
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('search')}
            className="text-xs font-semibold text-slate-900 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <span>Voir tout le catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {VINTAGE_CATALOGUE.slice(0, 6).map((app) => {
            // Prendre la première version disponible pour tester le statut par défaut
            const firstVersion = app.versions?.[0];
            const evalReport = firstVersion
              ? ApiService.evaluateCompatibility(activeDevice, firstVersion, app.name)
              : null;

            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <img
                      src={app.artworkUrl}
                      alt={app.name}
                      referrerPolicy="no-referrer"
                      className="w-13 h-13 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {app.name}
                      </h3>
                      <div className="text-xs text-slate-500 truncate">
                        {app.sellerName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                        {app.bundleId}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {app.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      {app.versions?.length || 0} versions archivées
                    </span>
                    {evalReport && <CompatibilityBadge status={evalReport.status} size="sm" />}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSelectApp(app)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <span>Explorer les versions & compatibilité</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Raccourcis d'actions rapides */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateTab('search')}
          className="text-left bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-colors group"
        >
          <Search className="w-5 h-5 text-slate-700 mb-2 group-hover:text-blue-600 transition-colors" />
          <div className="font-bold text-sm text-slate-900">Rechercher une application</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Interrogez l'iTunes Store officiel et le registre d'anciennes versions
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('devices')}
          className="text-left bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-colors group"
        >
          <Smartphone className="w-5 h-5 text-slate-700 mb-2 group-hover:text-blue-600 transition-colors" />
          <div className="font-bold text-sm text-slate-900">Simulateur & Appareils USB</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Alternez entre iPhone 4, 5, 6, 7 ou 8 et testez les révisions d'iOS
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('installation')}
          className="text-left bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-colors group"
        >
          <DownloadCloud className="w-5 h-5 text-slate-700 mb-2 group-hover:text-blue-600 transition-colors" />
          <div className="font-bold text-sm text-slate-900">Centre d'installation sécurisé</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Déployez des IPAs certifiés avec validation SHA-256 et confirmation explicite
          </div>
        </button>
      </section>
    </div>
  );
};
