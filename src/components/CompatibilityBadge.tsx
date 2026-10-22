// src/components/CompatibilityBadge.tsx
// Strict status badges conforming to the domain definitions

import React from 'react';
import {
  HelpCircle,
  FileCheck2,
  DownloadCloud,
  CheckCircle2,
  Sparkles,
  AlertOctagon,
} from 'lucide-react';
import { CompatibilityStatus } from '../types';

interface Props {
  status: CompatibilityStatus;
  size?: 'sm' | 'md';
  showDescription?: boolean;
}

interface StatusMeta {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  containerClass: string;
  textClass: string;
  description: string;
}

const STATUS_MAP: Record<CompatibilityStatus, StatusMeta> = {
  UNKNOWN: {
    label: 'Compatibilité inconnue',
    icon: HelpCircle,
    containerClass: 'bg-slate-100 text-slate-700 border-slate-200',
    textClass: 'text-slate-700',
    description: 'Métadonnées insuffisantes pour certifier la compatibilité matérielle.',
  },
  THEORETICALLY_COMPATIBLE: {
    label: 'Compatible sur le papier',
    icon: FileCheck2,
    containerClass: 'bg-blue-50 text-blue-800 border-blue-200',
    textClass: 'text-blue-800',
    description: "L'OS et l'architecture processeur correspondent, mais le binaire ou la signature reste à certifier.",
  },
  INSTALLABLE: {
    label: 'Installable',
    icon: DownloadCloud,
    containerClass: 'bg-amber-50 text-amber-800 border-amber-200',
    textClass: 'text-amber-800',
    description: "L'archive est intègre (SHA-256 certifié) et sa signature permet le déploiement sur cet appareil.",
  },
  INSTALLED: {
    label: 'Installation réussie',
    icon: CheckCircle2,
    containerClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    textClass: 'text-emerald-800',
    description: "L'application a été enregistrée avec succès sur l'appareil par installation_proxy.",
  },
  VERIFIED_WORKING: {
    label: 'Fonctionnement testé',
    icon: Sparkles,
    containerClass: 'bg-green-100 text-green-900 border-green-300',
    textClass: 'text-green-900',
    description: "Validé en conditions réelles : l'application s'exécute sans crash sur ce modèle.",
  },
  INCOMPATIBLE: {
    label: 'Incompatible',
    icon: AlertOctagon,
    containerClass: 'bg-rose-50 text-rose-800 border-rose-200',
    textClass: 'text-rose-800',
    description: "Incompatibilité bloquante (rupture 32-bit sur iOS 11+, OS insuffisant ou architecture absente).",
  },
};

export const CompatibilityBadge: React.FC<Props> = ({
  status,
  size = 'sm',
  showDescription = false,
}) => {
  const meta = STATUS_MAP[status] || STATUS_MAP.UNKNOWN;
  const Icon = meta.icon;

  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-3 py-1.5 text-sm gap-2';

  return (
    <div className="inline-flex flex-col">
      <span
        className={`inline-flex items-center font-semibold rounded-md border ${meta.containerClass} ${sizeClasses} whitespace-nowrap shrink-0`}
        title={meta.description}
      >
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} />
        <span>{meta.label}</span>
      </span>
      {showDescription && (
        <span className="text-[11px] text-slate-500 mt-1 leading-snug">
          {meta.description}
        </span>
      )}
    </div>
  );
};
