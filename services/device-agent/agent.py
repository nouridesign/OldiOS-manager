# services/device-agent/agent.py
"""
OldiOS Manager — Agent Local macOS (Démon USB sécurisé)
Interroge libimobiledevice / usbmuxd de manière passive et strictement contrôlée.
Port d'écoute par défaut : 127.0.0.1:27015
"""

import subprocess
import os
import secrets
import zipfile
import plistlib
import hashlib
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="OldiOS Local Device Agent",
    version="1.0.0",
    description="Agent démon local macOS pour communication USB avec appareils vintage iOS"
)

# Sécurité : Génération d'un jeton aléatoire au démarrage du processus
LOCAL_AGENT_TOKEN = os.environ.get("OLDIOS_AGENT_TOKEN", secrets.token_hex(24))
print("=" * 64)
print(f"🔒 [OldiOS Agent] Jeton de session locale généré :")
print(f"   {LOCAL_AGENT_TOKEN}")
print("   (Copiez ce jeton dans les Paramètres de l'application web)")
print("=" * 64)

# Politique CORS : Strictement limitée à l'application web locale et Tauri
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

DEVICE_ARCH_MAP: Dict[str, Dict[str, Any]] = {
    "iPhone3,1": {"name": "iPhone 4 (GSM)", "arch": "armv7", "soc": "Apple A4"},
    "iPhone3,2": {"name": "iPhone 4 (GSM Rev A)", "arch": "armv7", "soc": "Apple A4"},
    "iPhone3,3": {"name": "iPhone 4 (CDMA)", "arch": "armv7", "soc": "Apple A4"},
    "iPhone4,1": {"name": "iPhone 4S", "arch": "armv7", "soc": "Apple A5"},
    "iPhone5,1": {"name": "iPhone 5 (GSM)", "arch": "armv7s", "soc": "Apple A6"},
    "iPhone5,2": {"name": "iPhone 5 (Global)", "arch": "armv7s", "soc": "Apple A6"},
    "iPhone5,3": {"name": "iPhone 5c (GSM)", "arch": "armv7s", "soc": "Apple A6"},
    "iPhone5,4": {"name": "iPhone 5c (Global)", "arch": "armv7s", "soc": "Apple A6"},
    "iPhone6,1": {"name": "iPhone 5s (GSM)", "arch": "arm64", "soc": "Apple A7"},
    "iPhone6,2": {"name": "iPhone 5s (Global)", "arch": "arm64", "soc": "Apple A7"},
    "iPhone7,1": {"name": "iPhone 6 Plus", "arch": "arm64", "soc": "Apple A8"},
    "iPhone7,2": {"name": "iPhone 6", "arch": "arm64", "soc": "Apple A8"},
    "iPhone8,1": {"name": "iPhone 6s", "arch": "arm64", "soc": "Apple A9"},
    "iPhone8,2": {"name": "iPhone 6s Plus", "arch": "arm64", "soc": "Apple A9"},
    "iPhone8,4": {"name": "iPhone SE (1ère gén.)", "arch": "arm64", "soc": "Apple A9"},
    "iPhone9,1": {"name": "iPhone 7 (Global)", "arch": "arm64", "soc": "Apple A10 Fusion"},
    "iPhone9,3": {"name": "iPhone 7 (GSM)", "arch": "arm64", "soc": "Apple A10 Fusion"},
    "iPhone10,1": {"name": "iPhone 8 (Global)", "arch": "arm64", "soc": "Apple A11 Bionic"},
    "iPhone10,4": {"name": "iPhone 8 (GSM)", "arch": "arm64", "soc": "Apple A11 Bionic"},
}

def verify_agent_token(x_oldios_agent_token: Optional[str] = Header(None)):
    """Valide la présence du jeton secret local afin de bloquer les attaques de tiers."""
    if not x_oldios_agent_token or x_oldios_agent_token != LOCAL_AGENT_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requête refusée : Jeton local d'authentification invalide ou manquant."
        )
    return x_oldios_agent_token

class DeviceAgentInfo(BaseModel):
    udid_masked: str
    product_type: str
    marketing_name: str
    product_version: str
    build_version: str
    cpu_architecture: str
    soc: str
    is_paired: bool
    lockdown_status: str
    is_simulated: bool
    status_detail: str

def query_usb_device() -> Optional[DeviceAgentInfo]:
    """Interroge libimobiledevice via ideviceinfo de façon passive."""
    try:
        # Vérification du ProductType
        p = subprocess.run(["ideviceinfo", "-k", "ProductType"], capture_output=True, text=True, timeout=3)
        if p.returncode != 0:
            return None

        product_type = p.stdout.strip()
        version_proc = subprocess.run(["ideviceinfo", "-k", "ProductVersion"], capture_output=True, text=True, timeout=2)
        build_proc = subprocess.run(["ideviceinfo", "-k", "BuildVersion"], capture_output=True, text=True, timeout=2)
        udid_proc = subprocess.run(["ideviceinfo", "-k", "UniqueDeviceID"], capture_output=True, text=True, timeout=2)

        raw_udid = udid_proc.stdout.strip()
        masked = f"{raw_udid[:4]}...{raw_udid[-4:]}" if len(raw_udid) >= 8 else "PROTECTED"

        meta = DEVICE_ARCH_MAP.get(product_type, {
            "name": f"Appareil iOS ({product_type})",
            "arch": "arm64" if int(product_type.replace("iPhone", "").split(",")[0] or 0) >= 6 else "armv7",
            "soc": "Apple Silicon"
        })

        return DeviceAgentInfo(
            udid_masked=masked,
            product_type=product_type,
            marketing_name=meta["name"],
            product_version=version_proc.stdout.strip(),
            build_version=build_proc.stdout.strip(),
            cpu_architecture=meta["arch"],
            soc=meta["soc"],
            is_paired=True,
            lockdown_status="trusted",
            is_simulated=False,
            status_detail="Connecté en direct via USB (Lecture seule)"
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        # Si libimobiledevice n'est pas encore installé, renvoyer None ou simulateur explicite
        return None

@app.get("/agent/v1/health")
async def health_check():
    """Vérification de l'état du démon local."""
    return {"status": "ONLINE", "version": "1.0.0", "mode": "READ_ONLY_LOCKDOWN"}

@app.get("/agent/v1/device", dependencies=[Depends(verify_agent_token)])
async def get_connected_device():
    """Détecte l'appareil physique connecté au port USB de la machine hôte."""
    device = query_usb_device()
    if not device:
        return {
            "connected": False,
            "device": None,
            "message": "Aucun iPhone détecté sur le port USB (veuillez déverrouiller et accepter 'Faire confiance')."
        }
    return {"connected": True, "device": device}

class IPAParseRequest(BaseModel):
    file_path: str = Field(..., description="Chemin absolu du fichier .ipa local")

@app.post("/agent/v1/ipa/inspect", dependencies=[Depends(verify_agent_token)])
async def inspect_local_ipa(payload: IPAParseRequest):
    """
    Analyse statique d'une archive IPA :
    - Extraction d'Info.plist
    - Détection de MinimumOSVersion et UIRequiredDeviceCapabilities
    - Calcul du SHA-256
    """
    path = payload.file_path
    if not os.path.exists(path) or not path.lower().endswith(".ipa"):
        raise HTTPException(status_code=400, detail="Fichier IPA invalide ou inaccessible.")

    # Calcul du hash SHA-256
    sha256_hash = hashlib.sha256()
    with open(path, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    calculated_sha256 = sha256_hash.hexdigest()

    # Extraction d'Info.plist
    try:
        with zipfile.ZipFile(path, 'r') as zip_ref:
            plist_files = [n for n in zip_ref.namelist() if n.endswith('.app/Info.plist')]
            if not plist_files:
                raise HTTPException(status_code=400, detail="Archive IPA invalide : Info.plist introuvable.")

            plist_bytes = zip_ref.read(plist_files[0])
            parsed_plist = plistlib.loads(plist_bytes)

            bundle_id = parsed_plist.get("CFBundleIdentifier", "Inconnu")
            version_str = parsed_plist.get("CFBundleShortVersionString") or parsed_plist.get("CFBundleVersion", "1.0")
            min_os = parsed_plist.get("MinimumOSVersion", "Inconnu")

            # Détection de la signature
            has_provision = any(n.endswith('.app/embedded.mobileprovision') for n in zip_ref.namelist())
            has_sc_info = any("SC_Info" in n for n in zip_ref.namelist())

            sig_type = "FAIRPLAY_ENCRYPTED" if has_sc_info else ("AD_HOC" if has_provision else "UNSIGNED")

            return {
                "file_path": path,
                "file_size_bytes": os.path.getsize(path),
                "sha256": calculated_sha256,
                "bundle_id": bundle_id,
                "version_number": version_str,
                "minimum_os_version": min_os,
                "signature_type": sig_type,
                "has_embedded_provision": has_provision
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'analyse de l'archive IPA : {str(e)}")
