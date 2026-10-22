// src/views/SettingsView.tsx
// Paramètres de configuration de l'agent local macOS et politiques de sécurité

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Globe,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Save,
  Info,
} from 'lucide-react';
import { AgentSettings } from '../types';
import { ApiService } from '../services/apiService';

interface Props {
  settings: AgentSettings;
  onSaveSettings: (settings: AgentSettings) => void;
  onLogOperation: (log: any) => void;
}

export const SettingsView: React.FC<Props> = ({
  settings,
  onSaveSettings,
  onLogOperation,
}) => {
  const [formData, setFormData] = useState<AgentSettings>({ ...settings });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestAgent = async () => {
    setTestingConnection(true);
    setTestResult(null);

    const probe = await ApiService.probeLocalAgent(formData);
    setTestingConnection(false);

    if (probe.online) {
      setTestResult({
        success: true,
        message: probe.device
          ? `Connexion établie ! Appareil détecté : ${probe.device.marketingName} (iOS ${probe.device.productVersion}).`
          : 'Agent local joint avec succès (aucun appareil physique actuellement branché).',
      });
    } else {
      setTestResult({
        success: false,
        message: probe.message || 'Impossible de joindre le démon sur cette adresse.',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);

    onLogOperation({
      type: 'SETTINGS_UPDATE',
      deviceName: 'Configuration Système',
      status: 'SUCCESS',
      details: `Mise à jour des paramètres : Agent URL=${formData.agentUrl}, Pays=${formData.countryCode}.`,
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Paramètres du système & Agent local
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Configurez l'interfaçage avec le démon macOS natif, la région de l'App Store et les contraintes de sécurité.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Agent Local macOS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900">
            <Key className="w-5 h-5 text-slate-700" />
            <span>Communication avec l'Agent local macOS (usbmuxd)</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            L'agent s'exécute sur votre Mac hôte (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">services/device-agent/agent.py</code>) et relaie en lecture seule les requêtes <code className="font-mono">ideviceinfo</code> et <code className="font-mono">installation_proxy</code>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse URL de l'Agent Local
              </label>
              <input
                type="text"
                value={formData.agentUrl}
                onChange={(e) => setFormData({ ...formData, agentUrl: e.target.value })}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="http://127.0.0.1:27015"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jeton de session éphémère (X-OldiOS-Agent-Token)
              </label>
              <input
                type="password"
                value={formData.agentToken}
                onChange={(e) => setFormData({ ...formData, agentToken: e.target.value })}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jeton secret affiché au démarrage du démon"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestAgent}
              disabled={testingConnection}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>Tester la connectivité de l'agent</span>
            </button>

            {testResult && (
              <div
                className={`text-xs flex items-center gap-1.5 font-medium ${
                  testResult.success ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section App Store & Métadonnées */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900">
            <Globe className="w-5 h-5 text-slate-700" />
            <span>Storefront & Localisation de l'API iTunes</span>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Région de l'App Store
            </label>
            <select
              value={formData.countryCode}
              onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <optgroup label="Afrique du Nord & Moyen-Orient">
                <option value="MA">🇲🇦 Maroc (MA)</option>
                <option value="DZ">🇩🇿 Algérie (DZ)</option>
                <option value="TN">🇹🇳 Tunisie (TN)</option>
                <option value="AE">🇦🇪 Émirats arabes unis (AE)</option>
                <option value="SA">🇸🇦 Arabie Saoudite (SA)</option>
              </optgroup>
              <optgroup label="Europe francophone & limitrophe">
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
        </div>

        {/* Section Politiques de Sécurité */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900">
            <Shield className="w-5 h-5 text-slate-700" />
            <span>Garde-fous d'intégrité et de sécurité</span>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.strictSha256Check}
                onChange={(e) => setFormData({ ...formData, strictSha256Check: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Exiger la vérification d'empreinte SHA-256
                </div>
                <div className="text-xs text-slate-500">
                  Interdit tout déploiement si le binaire IPA ne dispose pas d'un hachage SHA-256 certifié dans le registre.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rejectUnsignedIpa}
                onChange={(e) => setFormData({ ...formData, rejectUnsignedIpa: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Bloquer catégoriquement les fichiers non signés (UNSIGNED)
                </div>
                <div className="text-xs text-slate-500">
                  Refuse les paquets dépourvus de signature Ad-Hoc, In-House ou FairPlay, conformément à la politique anti-contournement.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.maskUdid}
                onChange={(e) => setFormData({ ...formData, maskUdid: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Masquer l'identifiant matériel UDID
                </div>
                <div className="text-xs text-slate-500">
                  Tronque l'UDID (ex: 7f1a...4a9e) dans les vues de l'interface afin de protéger l'anonymat de l'appareil.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requireDoubleConfirmation}
                onChange={(e) => setFormData({ ...formData, requireDoubleConfirmation: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Exiger une confirmation explicite avant chaque installation
                </div>
                <div className="text-xs text-slate-500">
                  Affiche obligatoirement un dialogue d'impact et une case à cocher avant tout transfert USB.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les paramètres</span>
          </button>

          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Paramètres mis à jour avec succès !</span>
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
