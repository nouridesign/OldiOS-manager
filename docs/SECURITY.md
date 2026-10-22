# Charte de Sécurité & Protection de la Vie Privée — OldiOS Manager

## 1. Principes Fondamentaux Non Négociables

OldiOS Manager applique une politique stricte de sécurité opérationnelle et de respect du droit numérique :

1. **Aucun mot de passe ni identifiant Apple** : Le système ne demande jamais, ne transmet jamais et ne stocke aucun identifiant ou mot de passe Apple ID.
2. **Respect des contrôles de signature d'iOS** : Aucun mécanisme de contournement des signatures de code (code signing) ou des protections matérielles du Secure Enclave n'est mis en œuvre. Les applications doivent être signées légalement (profil Ad-Hoc avec UDID enregistré, certificat d'entreprise Enterprise In-House, certificat de développement, ou FairPlay lié au compte actif sur l'appareil).
3. **Respect de l'activation et des licences** : Aucun contournement d'écran de verrouillage d'activation (iCloud Activation Lock) ou de restrictions de licences commerciales.
4. **Distribution autorisée exclusivement** : Les fichiers proposés ou acceptés dans le système doivent provenir d'archives publiques autorisées, d'applications open source ou de paquets soumis directement par l'utilisateur disposant des droits nécessaires.
5. **Intégrité SHA-256 obligatoire** : Chaque archive `.ipa` fait l'objet d'un hachage cryptographique SHA-256 avant tout transfert. Si l'empreinte calculée diffère de l'empreinte documentée, l'opération est immédiatement interrompue.
6. **Interdiction formelle de flash ou d'effacement automatique** : Le système ne peut sous aucun prétexte déclencher une restauration d'usine, un effacement de données ou une mise à jour de firmware en tâche de fond.

## 2. Sécurisation de l'Agent Local (macOS)

L'agent macOS s'exécute sur l'adresse de bouclage locale `127.0.0.1:27015`. Afin d'empêcher toute attaque par traversée d'origine (Cross-Origin Resource Sharing / CSRF) provenant de sites tiers malveillants visités dans le navigateur :

- **Jeton d'autorisation éphémère (`X-OldiOS-Agent-Token`)** : Lors de son initialisation, l'agent génère un secret cryptographique aléatoire de 32 octets (64 caractères hexadécimaux). Toutes les requêtes HTTP adressées à l'agent doivent obligatoirement fournir ce jeton dans l'en-tête de requête.
- **Politique CORS restrictive** : Seules les origines `http://localhost:3000` et `tauri://localhost` sont expressément admises.
- **Opérations passives (Lecture seule) en phase initiale** : En mode diagnostic, l'agent utilise exclusivement les commandes d'inspection `ideviceinfo` et ne transmet aucune charge utile à l'appareil.

## 3. Masquage de l'UDID et Données Personnelles

L'identifiant unique de périphérique (UDID - Unique Device Identifier) est une donnée sensible persistante.
- L'UDID n'est jamais affiché en clair dans l'interface utilisateur web (format masqué : `7f1a...4a9e`).
- L'UDID n'est jamais envoyé à des serveurs tiers ou télémétriques.
- Il est utilisé localement uniquement pour valider si un profil de provisionnement `.mobileprovision` contient l'appareil ciblé.

## 4. Double Confirmation Utilisateur

Avant tout envoi de binaire sur un appareil via `installation_proxy` :
- Un résumé d'impact affiche l'ID de paquet (Bundle ID), la version, l'empreinte SHA-256 et la méthode d'installation retenue.
- L'utilisateur doit valider explicitement l'action par une confirmation interactive.
