
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
from typing import Tuple, Dict, Any

import requests
from requests import get, RequestException


# === À personnaliser ===
url_air = "http://88.175.37.47:8123/api/states/sensor.esphome_web_8a9680_temperature_air"  # TODO: mettre l'URL réelle
url_eau = "http://88.175.37.47:8123/api/states/sensor.esphome_web_8a9680_temperature_eau_truites"  # TODO: mettre l'URL réelle
url_press = "http://88.175.37.47:8123/api/states/sensor.sersortruites_pressure_sensor"  # TODO: mettre l'URL réelle


headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI5N2ZhNjM5YTg4ZmM0YjNlODk5YjNkZDhjZjJjNDZiZSIsImlhdCI6MTc2NDg4NjI4NCwiZXhwIjoyMDgwMjQ2Mjg0fQ.1vthj1zju3RFaViXj-R1UAALH-aGhGRmqHQyGwUKIpc",  # TODO: adapter si nécessaire
    "Accept": "application/json",
    
}

DATA_FILE = "data.txt"
TMP_FILE = "data.tmp"


def fetch_json(endpoint: str, headers: Dict[str, str], timeout: int = 10) -> Dict[str, Any]:
    """Récupère le JSON depuis un endpoint, renvoie {} en cas d'erreur."""
    try:
        resp = get(endpoint, headers=headers, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except (RequestException, ValueError) as e:
        print(f"Invalid response for {endpoint}: {e}")
        return {}


def extract_pair(data: Dict[str, Any], fallback_name: str) -> Tuple[str, str]:
    """
    Extrait un couple 'nom lisible' et 'valeur unitaire' à afficher.
    - nom = attributes.friendly_name ou fallback
    - valeur = state (brut) + attributes.unit_of_measurement (si présent)
    Retourne (nom, 'valeur unité') ou (nom, 'N/A').
    """
    attrs = data.get("attributes", {}) if isinstance(data, dict) else {}
    nom = attrs.get("friendly_name", fallback_name)
    state = data.get("state", "N/A")
    unit = attrs.get("unit_of_measurement", "")

    # Mise en forme de la partie "valeur - data"
    if unit:
        valeur_data = f"{state} {unit}"
    else:
        valeur_data = f"{state}"

    return nom, valeur_data


def write_atomically(path_final: str, path_tmp: str, lines: str):
    """Écriture atomique texte brut."""
    with open(path_tmp, "w", encoding="utf-8") as f:
        f.write(lines)
    os.replace(path_tmp, path_final)


def main():
    endpoints = [
        ("Air", url_air),
        ("Eau", url_eau),
        ("Pression", url_press),
    ]

    output_lines = []

    for label, endpoint in endpoints:
        data = fetch_json(endpoint, headers)
        if not data:
            # ligne explicite en cas d'erreur
            output_lines.append(f"{label} = N/A\n")
            continue

        nom, valeur_data = extract_pair(data, fallback_name=label)

        # Ligne au format demandé: "Nom = valeur unité"
        output_lines.append(f"{nom} = {valeur_data}\n")

        # Log console (optionnel)
        print(f"{nom} : {valeur_data}")

    # Concaténer et écrire
    content = "".join(output_lines)
    try:
        write_atomically(DATA_FILE, TMP_FILE, content)
        print(f"{DATA_FILE} mis à jour.")
    except Exception as e:
        print("Erreur d'écriture du fichier:", e, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
