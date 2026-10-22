# OldiOS Manager

Plateforme complète de diagnostic matériel, analyse de compatibilité et déploiement contrôlé d'anciennes applications iOS pour appareils vintage (iPhone 4 à iPhone 8).

---

## 🎯 Objectifs

1. **Détection matérielle précise** : Identification du modèle exact (`ProductType`), de la version d'iOS (`ProductVersion`) et de l'architecture processeur (`armv7`, `armv7s`, `arm64`).
2. **Catalogage des versions d'applications** : Recherche sur l'App Store officiel combinée avec l'historique archivé des versions anciennes.
3. **Moteur d'évaluation de compatibilité rigoureux** : Détection sans faille des ruptures d'architecture (notamment la fin du 32-bit sur iOS 11), des contraintes de versions et des DRM FairPlay.
4. **Statuts stricts et non ambigus** :
   - *« Compatibilité inconnue »*
   - *« Compatible sur le papier »*
   - *« Installable »*
   - *« Installation réussie »*
   - *« Fonctionnement testé »*
   - *« Incompatible »*
5. **Déploiement sécurisé avec agent macOS** : Validation d'intégrité SHA-256, vérification de signature et confirmation explicite de l'utilisateur.

---

## 📦 Organisation du Monorepo

```
oldios-manager/
├── apps/
│   ├── web/                     # Interface Web Next.js / React 19 / TypeScript / Tailwind CSS
│   └── desktop/                 # Client lourd macOS Tauri v2
├── services/
│   ├── api/                     # API REST Python FastAPI (Compatibilité, Catalogage)
│   └── device-agent/            # Agent local macOS communicant avec libimobiledevice / usbmuxd
├── packages/
│   └── shared/                  # Types et constantes matérielles partagés
└── docs/
    ├── ARCHITECTURE.md          # Architecture système détaillée
    └── SECURITY.md              # Politique de sécurité et protection des données
```

---

## 🚀 Commandes de Démarrage & Développement

### 1. Démarrage de l'Application Web (Interface Complète)
```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement (port 3000)
npm run dev
```

### 2. Démarrage du Backend FastAPI (`services/api`)
```bash
cd services/api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

### 3. Démarrage de l'Agent Local macOS (`services/device-agent`)
```bash
cd services/device-agent
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn agent:app --port 27015 --reload
```

---

## 🧪 Exécution des Tests

### Tests Python du Moteur de Compatibilité (Backend)
```bash
cd services/api
pytest tests/ -v
```

### Tests Frontend & Validation TypeScript
```bash
npm run lint
```

---

## ⚠️ Limitations Réelles du Matériel & Précisions Techniques

1. **Rupture 32-bit d'iOS 11** : Les iPhone 5s, 6, 6s, 7 et 8 disposent d'un processeur 64-bit (`arm64`). Cependant, dès lors qu'un appareil passe sous iOS 11 ou version supérieure, Apple a supprimé l'ensemble des bibliothèques 32-bit du noyau. Une application compilée uniquement en `armv7` refusera catégoriquement de s'exécuter, même sur un processeur capable de 32-bit.
2. **DRM FairPlay Apple Store** : Un fichier `.ipa` téléchargé légalement depuis l'App Store par le passé est chiffré par FairPlay. Il ne peut s'exécuter sur un iPhone que si le compte Apple ayant acquis la licence est configuré et appairé sur l'appareil.
3. **Impossibilité de WebUSB direct pour iOS** : Les navigateurs web ne peuvent pas dialoguer directement avec le démon `usbmuxd` d'Apple via WebUSB en raison de la couche de multiplexage propriétaire. L'agent natif local (ou l'application Tauri) est indispensable pour les échanges USB réels.
4. **Services en ligne arrêtés** : Même si une ancienne application s'installe et se lance parfaitement sur un iPhone 4 sous iOS 6 (ex: YouTube v1.x ou Twitter v3.x), ses serveurs de backend d'origine peuvent être définitivement éteints ou avoir changé d'API (TLS 1.2/1.3 obligatoire, tokens OAuth révoqués). Le statut *« Installation réussie »* ne garantit donc pas le *« Fonctionnement testé »*.
