# services/api/tests/test_compatibility.py
"""
Tests unitaires pour le moteur d'évaluation de compatibilité d'OldiOS Manager.
Vérifie rigoureusement les ruptures 32-bit / 64-bit, la compatibilité d'OS, les signatures et les statuts.
"""

import pytest
from app.domain.compatibility import CompatibilityEngine, DeviceSpec, AppVersionSpec

def test_ios11_rejects_pure_32bit_app():
    """Un appareil sous iOS 11+ (ex: iPhone 8 sous iOS 14) doit rejeter un binaire 32-bit (armv7/armv7s)."""
    device = DeviceSpec(
        product_type="iPhone10,1",
        product_version="14.8.1",
        cpu_architecture="arm64",
        marketing_name="iPhone 8"
    )
    app = AppVersionSpec(
        version_number="1.4.0",
        minimum_os_version="6.0",
        maximum_os_version="9.3.5",
        supported_architectures=["armv7"],
        signature_type="AD_HOC",
        download_available=True,
        sha256="abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    )
    result = CompatibilityEngine.evaluate(device, app)
    assert result.status == "INCOMPATIBLE"
    assert any("Rupture iOS 11+" in blocker for blocker in result.blockers)

def test_32bit_device_rejects_pure_64bit_app():
    """Un iPhone 5 (armv7s, 32-bit) doit rejeter une application qui ne contient que arm64."""
    device = DeviceSpec(
        product_type="iPhone5,1",
        product_version="6.1.4",
        cpu_architecture="armv7s",
        marketing_name="iPhone 5"
    )
    app = AppVersionSpec(
        version_number="4.0.0",
        minimum_os_version="6.0",
        supported_architectures=["arm64"],
        signature_type="ENTERPRISE",
        download_available=True,
        sha256="123456abcdef123456abcdef123456abcdef123456abcdef123456abcdef1234"
    )
    result = CompatibilityEngine.evaluate(device, app)
    assert result.status == "INCOMPATIBLE"
    assert any("Architecture incompatible" in blocker for blocker in result.blockers)

def test_device_os_too_low():
    """Un iPhone 4 sous iOS 7.1.2 ne peut pas installer une version exigeant iOS 8.0+."""
    device = DeviceSpec(
        product_type="iPhone3,1",
        product_version="7.1.2",
        cpu_architecture="armv7",
        marketing_name="iPhone 4"
    )
    app = AppVersionSpec(
        version_number="2.0.0",
        minimum_os_version="8.0",
        supported_architectures=["armv7", "arm64"],
        signature_type="AD_HOC",
        download_available=True,
        sha256="0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff"
    )
    result = CompatibilityEngine.evaluate(device, app)
    assert result.status == "INCOMPATIBLE"
    assert any("Version iOS trop ancienne" in blocker for blocker in result.blockers)

def test_theoretically_compatible_when_file_not_cached():
    """Si l'application est compatible en OS et Arch mais sans binaire disponible, le statut est THEORETICALLY_COMPATIBLE."""
    device = DeviceSpec(
        product_type="iPhone5,1",
        product_version="6.1.4",
        cpu_architecture="armv7s",
        marketing_name="iPhone 5"
    )
    app = AppVersionSpec(
        version_number="2.1.0",
        minimum_os_version="5.0",
        supported_architectures=["armv7", "armv7s"],
        signature_type="FAIRPLAY_ENCRYPTED",
        download_available=False,
        sha256=None
    )
    result = CompatibilityEngine.evaluate(device, app)
    assert result.status == "THEORETICALLY_COMPATIBLE"
    assert len(result.blockers) == 0

def test_installable_when_file_and_signature_valid():
    """Si le fichier est disponible, SHA256 présent et signature Ad-Hoc/Enterprise, le statut est INSTALLABLE."""
    device = DeviceSpec(
        product_type="iPhone4,1",
        product_version="6.1.3",
        cpu_architecture="armv7",
        marketing_name="iPhone 4S"
    )
    app = AppVersionSpec(
        version_number="1.5.0",
        minimum_os_version="5.1.1",
        supported_architectures=["armv7"],
        signature_type="AD_HOC",
        download_available=True,
        sha256="9999888877776666555544443333222211110000aaaabbbbccccddddeeeeffff"
    )
    result = CompatibilityEngine.evaluate(device, app)
    assert result.status == "INSTALLABLE"
    assert "MACOS_AGENT_USBMUX" in result.supported_methods
    assert len(result.blockers) == 0

def test_verified_working_status():
    """Si l'appareil fait partie des modèles formellement testés et éprouvés, le statut est VERIFIED_WORKING."""
    device = DeviceSpec(
        product_type="iPhone3,1",
        product_version="7.1.2",
        cpu_architecture="armv7",
        marketing_name="iPhone 4"
    )
    app = AppVersionSpec(
        version_number="1.0.0",
        minimum_os_version="4.3",
        supported_architectures=["armv7"],
        signature_type="AD_HOC",
        download_available=True,
        sha256="aaaabbbbccccddddeeeeffff0000111122223333444455556666777788889999",
        known_working_devices=["iPhone3,1", "iPhone4,1"]
    )
    result = CompatibilityEngine.evaluate(device, app)
    assert result.status == "VERIFIED_WORKING"
    assert any("Fonctionnement physique certifié" in reason for reason in result.reasons)
