# services/api/app/domain/compatibility.py
"""
OldiOS Manager — Moteur d'évaluation de compatibilité matérielle et binaire.
"""

from typing import List, Tuple, Optional
from packaging import version
from pydantic import BaseModel, Field

class DeviceSpec(BaseModel):
    product_type: str = Field(..., description="Ex: iPhone5,1")
    product_version: str = Field(..., description="Ex: 6.1.4")
    cpu_architecture: str = Field(..., description="Ex: armv7, armv7s, arm64")
    marketing_name: Optional[str] = None

class AppVersionSpec(BaseModel):
    version_number: str
    minimum_os_version: str
    maximum_os_version: Optional[str] = None
    supported_architectures: List[str]
    signature_type: str  # FAIRPLAY_ENCRYPTED, AD_HOC, ENTERPRISE, DEVELOPMENT, UNSIGNED
    download_available: bool
    sha256: Optional[str] = None
    known_working_devices: Optional[List[str]] = None

class CompatibilityResult(BaseModel):
    status: str  # UNKNOWN, THEORETICALLY_COMPATIBLE, INSTALLABLE, INSTALLED, VERIFIED_WORKING, INCOMPATIBLE
    reasons: List[str]
    blockers: List[str]
    warnings: List[str]
    supported_methods: List[str]

class CompatibilityEngine:
    @staticmethod
    def evaluate(device: DeviceSpec, app: AppVersionSpec) -> CompatibilityResult:
        reasons: List[str] = []
        blockers: List[str] = []
        warnings: List[str] = []
        supported_methods: List[str] = []

        try:
            dev_os = version.parse(device.product_version)
            min_os = version.parse(app.minimum_os_version)
        except Exception as e:
            return CompatibilityResult(
                status="UNKNOWN",
                reasons=[],
                blockers=[f"Erreur de syntaxe de version : {str(e)}"],
                warnings=[],
                supported_methods=[]
            )

        # 1. Vérification de l'OS Minimum
        if dev_os < min_os:
            blockers.append(
                f"Version iOS trop ancienne : L'appareil tourne sous iOS {device.product_version}, "
                f"alors que cette version de l'application requiert au minimum iOS {app.minimum_os_version}."
            )
        else:
            reasons.append(f"iOS {device.product_version} satisfait le prérequis minimal (requis: {app.minimum_os_version}+).")

        # 2. Vérification de l'OS Maximum (obsolescence documentée)
        if app.maximum_os_version:
            try:
                max_os = version.parse(app.maximum_os_version)
                if dev_os > max_os:
                    blockers.append(
                        f"Incompatibilité d'OS supérieur : L'application n'est plus supportée au-delà d'iOS {app.maximum_os_version} (appareil sous iOS {device.product_version})."
                    )
            except Exception:
                pass

        # 3. Règle d'or de l'architecture CPU
        has_32bit = any(arch in ['armv7', 'armv7s'] for arch in app.supported_architectures)
        has_64bit = 'arm64' in app.supported_architectures

        # Règle iOS 11 : Interdiction totale des binaires 32-bit
        if dev_os >= version.parse("11.0"):
            if not has_64bit:
                blockers.append(
                    f"Rupture iOS 11+ : L'appareil est sous iOS {device.product_version}. "
                    "Depuis iOS 11, Apple a totalement supprimé la couche 32-bit. "
                    "Cette application ne contenant qu'une tranche 32-bit, iOS refusera tout lancement."
                )
            else:
                reasons.append("Exécution 64-bit validée pour iOS 11+.")
        else:
            # Pour iOS < 11
            if device.cpu_architecture in ['armv7', 'armv7s'] and not has_32bit:
                blockers.append(
                    f"Architecture incompatible : L'appareil dispose d'un processeur 32-bit ({device.cpu_architecture}), "
                    "mais l'application ne contient qu'une tranche 64-bit (arm64)."
                )
            else:
                reasons.append(f"Compatibilité d'architecture vérifiée ({device.cpu_architecture} couvert).")

        # 4. Vérification de signature
        if app.signature_type == "UNSIGNED":
            blockers.append("Signature absente : Les appareils iOS non débridés (non-jailbreakés) rejettent les exécutables non signés.")
        elif app.signature_type == "FAIRPLAY_ENCRYPTED":
            warnings.append(
                "Chiffrement FairPlay détecté : L'archive provient de l'App Store officiel. "
                "Elle ne pourra se lancer que si le compte Apple ayant acquis l'application est configuré sur l'iPhone."
            )
        elif app.signature_type in ["AD_HOC", "DEVELOPMENT"]:
            reasons.append("Signature de développement ou Ad-Hoc détectée (déploiement contrôlé).")
        elif app.signature_type == "ENTERPRISE":
            reasons.append("Signature entreprise In-House valide.")
            supported_methods.append("ENTERPRISE_OTA")

        # Si des points bloquants existent, l'application est strictement incompatible
        if blockers:
            return CompatibilityResult(
                status="INCOMPATIBLE",
                reasons=reasons,
                blockers=blockers,
                warnings=warnings,
                supported_methods=[]
            )

        # Vérification si l'appareil a été formellement validé en conditions réelles
        if app.known_working_devices and device.product_type in app.known_working_devices:
            reasons.append(f"Fonctionnement physique certifié sur ce modèle ({device.product_type}).")
            if app.download_available and app.sha256:
                supported_methods.append("MACOS_AGENT_USBMUX")
                return CompatibilityResult(
                    status="VERIFIED_WORKING",
                    reasons=reasons,
                    blockers=[],
                    warnings=warnings,
                    supported_methods=supported_methods
                )

        # Détermination du statut Installable vs Compatible sur le papier
        if app.download_available and app.sha256 and app.signature_type in ["AD_HOC", "ENTERPRISE", "DEVELOPMENT"]:
            supported_methods.append("MACOS_AGENT_USBMUX")
            return CompatibilityResult(
                status="INSTALLABLE",
                reasons=reasons + ["Binaire archivé présent, empreinte SHA-256 certifiée et signature installable."],
                blockers=[],
                warnings=warnings,
                supported_methods=supported_methods
            )

        # Si compatible théoriquement mais sans binaire direct prêt
        return CompatibilityResult(
            status="THEORETICALLY_COMPATIBLE",
            reasons=reasons + ["L'OS et le processeur sont compatibles sur le papier."],
            blockers=[],
            warnings=warnings + ["Fichier IPA ou licence FairPlay requise pour finaliser l'installation."],
            supported_methods=["MACOS_AGENT_USBMUX"] if app.download_available else []
        )
