// src/views/SearchView.tsx
// Recherche d'applications — iTunes Store Public & Archives Vintage

import React, { useState, useEffect } from 'react';
import { Search, Filter, Layers, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { AppMetadata, DeviceInfo } from '../types';
import { ApiService } from '../services/apiService';
import { CompatibilityBadge } from '../components/CompatibilityBadge';
import { APP_STORE_COUNTRIES } from '../data/mockData';

interface Props {
  activeDevice: DeviceInfo;
  onSelectApp: (app: AppMetadata) => void;
  countryCode: string;
  onCountryChange?: (newCountry: string) => void;
}

export const SearchView: React.FC<Props> = ({
  activeDevice,
  onSelectApp,
  countryCode,
  onCountryChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('Facebook');
  const [apps, setApps] = useState<AppMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterOnlyArchived, setFilterOnlyArchived] = useState(false);
  const [filterCompatibleOnly, setFilterCompatibleOnly] = useState(false);

  const performSearch = async (term: string) => {
    setLoading(true);
    try {
      const results = await ApiService.searchApps(term, countryCode);
      setApps(results);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch(searchTerm);
  }, [countryCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      performSearch(searchTerm);
    }
  };

  // Filtrage côté client
  const filteredApps = apps.filter((app) => {
    if (filterOnlyArchived && !app.hasVintageArchives && !app.versions?.length) {
      return false;
    }
    if (filterCompatibleOnly && app.versions?.length) {
      // Vérifier si au moins une version est compatible ou installable
      const hasCompatibleVersion = app.versions.some((v) => {
        const report = ApiService.evaluateCompatibility(activeDevice, v, app.name);
        return report.status !== 'INCOMPATIBLE';
      });
      if (!hasCompatibleVersion) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Recherche d'applications & Archives
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Explorez le catalogue officiel de l'App Store combiné aux versions historiques préservées et documentées.
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom (ex: Twitter, Facebook, Flappy Bird, Angry Birds, VLC)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {onCountryChange && (
            <div className="sm:w-56 shrink-0">
              <select
                value={countryCode}
                onChange={(e) => onCountryChange(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-medium rounded-xl border border-slate-300 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                title="Boutique App Store régionale interrogée"
              >
                <optgroup label="Afrique du Nord & Moyen-Orient">
                  <option value="MA">🇲🇦 Maroc (MA)</option>
                  <option value="DZ">🇩🇿 Algérie (DZ)</option>
                  <option value="TN">🇹🇳 Tunisie (TN)</option>
                  <option value="AE">🇦🇪 Émirats arabes unis (AE)</option>
                  <option value="SA">🇸🇦 Arabie Saoudite (SA)</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="FR">🇫🇷 France (FR)</option>
                  <option value="BE">🇧🇪 Belgique (BE)</option>
                  <option value="CH">🇨🇭 Suisse (CH)</option>
                  <option value="ES">🇪🇸 Espagne (ES)</option>
                  <option value="IT">🇮🇹 Italie (IT)</option>
                  <option value="DE">🇩🇪 Allemagne (DE)</option>
                  <option value="GB">🇬🇧 Royaume-Uni (GB)</option>
                </optgroup>
                <optgroup label="Amériques & Asie">
                  <option value="US">🇺🇸 États-Unis (US)</option>
                  <option value="CA">🇨🇦 Canada (CA)</option>
                  <option value="JP">🇯🇵 Japon (JP)</option>
                </optgroup>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors shadow-xs whitespace-nowrap"
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </form>

        {/* Filtres et raccourcis thématiques */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Recherches populaires :</span>
            {['Facebook', 'Twitter', 'Flappy Bird', 'Instagram', 'Angry Birds', 'Tweetbot'].map(
              (tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchTerm(tag);
                    performSearch(tag);
                  }}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                >
                  {tag}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={filterOnlyArchived}
                onChange={(e) => setFilterOnlyArchived(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Archives vintage uniquement</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={filterCompatibleOnly}
                onChange={(e) => setFilterCompatibleOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Compatibles avec {activeDevice.marketingName}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Avertissement de transparence sur les données */}
      <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-slate-800">Transparence des sources :</span> Les métadonnées de version actuelle sont issues en direct de l'API publique de l'App Store (Boutique régionale : {APP_STORE_COUNTRIES.find(c => c.code === countryCode)?.flag || ''} {APP_STORE_COUNTRIES.find(c => c.code === countryCode)?.name || countryCode}). Les versions antérieures indisponibles sur les serveurs Apple actuels sont documentées avec le flag <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[11px]">[Archive Documentée]</code>.
        </p>
      </div>

      {/* Liste des résultats */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-800">Recherche dans les catalogues...</div>
          <div className="text-xs text-slate-400 mt-1">Interrogation de l'iTunes Store et de l'index vintage</div>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="text-base font-bold text-slate-800">Aucun résultat trouvé</div>
          <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Essayez de modifier votre recherche ou de désactiver les filtres pour afficher l'ensemble des paquets.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApps.map((app) => {
            const firstVersion = app.versions?.[0];
            const evalReport = firstVersion
              ? ApiService.evaluateCompatibility(activeDevice, firstVersion, app.name)
              : null;

            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <img
                      src={app.artworkUrl}
                      alt={app.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{app.name}</h3>
                      <div className="text-xs text-slate-500 truncate">{app.sellerName}</div>
                      <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                        {app.bundleId}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {app.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Version actuelle App Store :</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        v{app.currentVersion} (iOS {app.minimumOsVersion}+)
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Versions antérieures :</span>
                      <span className="font-medium text-slate-700">
                        {app.versions?.length || 0} archivées
                      </span>
                    </div>

                    {evalReport && (
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-400">Statut avec {activeDevice.marketingName} :</span>
                        <CompatibilityBadge status={evalReport.status} size="sm" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSelectApp(app)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <span>Consulter les versions & compatibilité</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
