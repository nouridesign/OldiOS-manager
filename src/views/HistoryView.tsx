// src/views/HistoryView.tsx
// Historique des opérations et journal d'audit cryptographique

import React, { useState } from 'react';
import {
  Clock,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
  Search,
} from 'lucide-react';
import { OperationLog } from '../types';

interface Props {
  logs: OperationLog[];
  onClearLogs: () => void;
}

export const HistoryView: React.FC<Props> = ({ logs, onClearLogs }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'ALL' && log.type !== filterType) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDevice = log.deviceName.toLowerCase().includes(q);
      const matchApp = log.appName?.toLowerCase().includes(q) || false;
      const matchDetails = log.details.toLowerCase().includes(q);
      if (!matchDevice && !matchApp && !matchDetails) return false;
    }
    return true;
  });

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `oldios_audit_log_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Historique des opérations & Audit
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Traçabilité exhaustive des vérifications de signatures, évaluations et tentatives de déploiement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter l'audit (JSON)</span>
          </button>

          <button
            onClick={onClearLogs}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Effacer le journal</span>
          </button>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrer par appareil, application ou mot-clé..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto">
          <span className="text-slate-400 font-medium mr-1">Type :</span>
          {[
            { id: 'ALL', label: 'Tout' },
            { id: 'DEVICE_DETECTED', label: 'Appareils' },
            { id: 'COMPATIBILITY_CHECK', label: 'Diagnostics' },
            { id: 'INSTALLATION_ATTEMPT', label: 'Installations' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau d'audit */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Aucun événement enregistré correspondant aux critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Horodatage</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Appareil</th>
                  <th className="py-3 px-3">Application</th>
                  <th className="py-3 px-3">Statut</th>
                  <th className="py-3 px-4">Détails de l'événement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      <span>SUCCÈS</span>
                    </span>
                  );
                  if (log.status === 'WARNING') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <AlertTriangle className="w-3 h-3" />
                        <span>AVERTISSEMENT</span>
                      </span>
                    );
                  } else if (log.status === 'FAILED' || log.status === 'BLOCKED') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        <span>BLOQUÉ</span>
                      </span>
                    );
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {log.type === 'DEVICE_DETECTED' && 'Détection USB'}
                        {log.type === 'COMPATIBILITY_CHECK' && 'Compatibilité'}
                        {log.type === 'INSTALLATION_ATTEMPT' && 'Déploiement'}
                        {log.type === 'SIGNATURE_VERIFY' && 'Signature'}
                        {log.type === 'SETTINGS_UPDATE' && 'Configuration'}
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                        {log.deviceName}
                      </td>

                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        {log.appName ? (
                          <span>
                            {log.appName} {log.versionNumber && <span className="font-mono text-slate-400">v{log.versionNumber}</span>}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {statusBadge}
                      </td>

                      <td className="py-3 px-4 text-slate-600 leading-relaxed">
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
