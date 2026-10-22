# Architecture Technique — OldiOS Manager

## 1. Vue d'ensemble du Système

OldiOS Manager est une suite logicielle conçue pour le diagnostic, l'évaluation de compatibilité et le déploiement contrôlé d'anciennes applications iOS sur les appareils allant de l'iPhone 4 (2010) à l'iPhone 8 (2017).

```
+-------------------------------------------------------------+
|                      Frontend Web                           |
|       (Next.js / React 19 / TypeScript / Tailwind CSS)      |
+------------------------------+------------------------------+
                               |
            HTTP/REST (v1)     |     HTTP Localhost (Jeton session)
                               v                               v
+------------------------------+       +------------------------------+
|       Service API            |       |     Agent Local macOS        |
|  (FastAPI / Python 3.11+)    |       |   (libimobiledevice / USB)   |
|  - Catalogue & Proxy iTunes  |       |   - usbmuxd (Passif)         |
|  - Moteur de Compatibilité   |       |   - Inspection Info.plist    |
|  - Vérification signatures   |       |   - installation_proxy sécurisé
+------------------------------+       +------------------------------+
                                                       | USB
                                                       v
                                       +------------------------------+
                                       |      iPhone Vintage          |
                                       |   (iPhone 4 -> iPhone 8)     |
                                       +------------------------------+
```

## 2. Structure du Monorepo

```
oldios-manager/
├── apps/
│   ├── web/                     # Application web Next.js / React
│   └── desktop/                 # Shell macOS natif Tauri v2
├── services/
│   ├── api/                     # Backend centralisé FastAPI
│   └── device-agent/            # Démon de communication USB local macOS
├── packages/
│   └── shared/                  # Types TypeScript, constantes et règles
└── docs/
    ├── ARCHITECTURE.md          # Architecture globale et flux
    └── SECURITY.md              # Sécurité, intégrité et politique de vie privée
```

## 3. Matrice de Référence Matérielle (iPhone 4 à iPhone 8)

| Modèle | Identifiant | SoC Apple | Architecture | Plage iOS Supportée | Règle 32-bit / 64-bit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **iPhone 4** | `iPhone3,1` | A4 (1 GHz) | `armv7` | iOS 4.0 -> 7.1.2 | 32-bit exclusif |
| **iPhone 4S** | `iPhone4,1` | A5 | `armv7` | iOS 5.0 -> 9.3.6 | 32-bit exclusif |
| **iPhone 5** | `iPhone5,1` | A6 | `armv7s` | iOS 6.0 -> 10.3.4 | 32-bit optimisé Swift |
| **iPhone 5c** | `iPhone5,3` | A6 | `armv7s` | iOS 7.0 -> 10.3.3 | 32-bit optimisé Swift |
| **iPhone 5s** | `iPhone6,1` | A7 | `arm64` | iOS 7.0 -> 12.5.7 | Hybride 32/64 (sur iOS < 11) |
| **iPhone 6 / 6 Plus** | `iPhone7,2` | A8 | `arm64` | iOS 8.0 -> 12.5.7 | Hybride 32/64 (sur iOS < 11) |
| **iPhone 6s / SE** | `iPhone8,1` | A9 | `arm64` | iOS 9.0 -> 15.8.3 | Hybride (si iOS <= 10) |
| **iPhone 7 / 7 Plus** | `iPhone9,3` | A10 Fusion | `arm64` | iOS 10.0 -> 15.8.3 | 32-bit sur iOS 10; 64-bit dès iOS 11 |
| **iPhone 8 / 8 Plus** | `iPhone10,1` | A11 Bionic | `arm64` | iOS 11.0 -> 16.7.10 | **64-bit strict** (32-bit bloqué au runtime) |

## 4. Les 5 Statuts de Compatibilité

Le système applique une séparation stricte entre les étapes du cycle de vie logiciel :

1. **`UNKNOWN` (Compatibilité inconnue)** : Données partielles, binaire non analysé ou métadonnées manquantes.
2. **`THEORETICALLY_COMPATIBLE` (Compatible sur le papier)** : Les conditions formelles sont remplies (`MinimumOSVersion <= OS appareil` et tranche d'architecture CPU compatible), mais le fichier ou la signature n'est pas encore certifié pour ce périphérique précis.
3. **`INSTALLABLE` (Installable)** : Le fichier `.ipa` est physiquement accessible, son empreinte cryptographique SHA-256 est certifiée conforme, et sa signature (Ad-Hoc, In-House Enterprise, Developer) autorise l'appareil cible.
4. **`INSTALLED` (Installation réussie)** : L'archive a été décompressée et enregistrée par le service `installation_proxy` de lockdown sans erreur système.
5. **`VERIFIED_WORKING` (Fonctionnement testé)** : L'application a été lancée et ses fonctionnalités principales ont été validées sans crash.
6. **`INCOMPATIBLE` (Incompatible)** : Détection d'un point de rupture bloquant (ex: binaire 32-bit exécuté sur iOS 11+, OS appareil inférieur à `MinimumOSVersion`, tranche `arm64` requise sur un iPhone 4/5).

## 5. Endpoints de l'API REST (`/api/v1`)

- `GET /api/v1/devices` : Liste des modèles de référence et états connectés.
- `GET /api/v1/apps/search?q={query}` : Recherche d'applications sur l'API iTunes avec enrichissement d'archives vintage.
- `GET /api/v1/apps/{id}` : Métadonnées exhaustives d'une application.
- `GET /api/v1/apps/{id}/versions` : Catalogue documenté des versions antérieures avec architectures et signatures.
- `POST /api/v1/apps/compatibility` : Évaluation rigoureuse de compatibilité entre un appareil et une version.
- `POST /api/v1/installations/check` : Contrôle pré-vol de sécurité avant toute opération d'installation.
- `POST /api/v1/installations` : Déclenchement d'une installation contrôlée avec confirmation utilisateur.
- `GET /api/v1/installations/{id}` : État en temps réel de l'opération et journaux d'audit.
