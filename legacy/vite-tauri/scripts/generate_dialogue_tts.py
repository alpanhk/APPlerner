"""Add offline fallback clips for the P4 listening dialogues.

Reads src/data/practice/a1_listening.json, synthesizes each unique line with the
installed Piper model, writes dialogue_*.wav into src/assets/tts_core, and merges
the phrase keys into manifest.json. Existing clips are preserved.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "assets" / "tts_core"
MANIFEST = OUT / "manifest.json"
SOURCE = ROOT / "src" / "data" / "practice" / "a1_listening.json"
PIPER_ROOT = Path(os.environ.get("APPDATA", "")) / "app.lernen.desktop" / "piper"
MODEL = PIPER_ROOT / "voices" / "de_eva_k_x_low.onnx"
EXE = PIPER_ROOT / "piper.exe"


def normalize_phrase(text: str) -> str:
    text = unicodedata.normalize("NFC", text).lower().replace("ß", "ss")
    text = re.sub(r"[.,!?.;:]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def main() -> None:
    if not EXE.exists() or not MODEL.exists():
        raise SystemExit(f"Piper/voice Jerman tidak ditemukan: {MODEL}")
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    phrases = manifest.setdefault("phrases", {})

    needed: dict[str, str] = {}
    for item in data["items"]:
        for index, line in enumerate(item["lines"], 1):
            key = normalize_phrase(line["de"])
            filename = f"dialogue_{item['id'].replace('-', '_')}_{index:02d}.wav"
            needed.setdefault(key, filename)

    with tempfile.TemporaryDirectory(prefix="lernen-dialogue-tts-") as temp_name:
        temp = Path(temp_name)
        for key, filename in needed.items():
            destination = OUT / filename
            if destination.exists():
                phrases[key] = filename
                continue
            output_file = (temp / filename).as_posix()
            command = [
                str(EXE),
                "--model",
                str(MODEL),
                "--espeak_data",
                str(PIPER_ROOT / "espeak-ng-data"),
                "--json-input",
                "--output_dir",
                str(temp),
                "--quiet",
            ]
            line = json.dumps({"text": key, "output_file": output_file}, ensure_ascii=False)
            proc = subprocess.run(
                command, input=line + "\n", text=True, encoding="utf-8", capture_output=True, check=False
            )
            if proc.returncode:
                raise SystemExit(proc.stderr or f"Piper gagal pada frasa: {key}")
            shutil.copyfile(temp / filename, destination)
            phrases[key] = filename

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    missing = [name for name in needed.values() if not (OUT / name).exists()]
    if missing:
        raise SystemExit(f"Klip dialog hilang: {missing}")
    print(f"Audio dialog siap: {len(needed)} frasa unik, {len(list(OUT.glob('dialogue_*.wav')))} file.")


if __name__ == "__main__":
    main()
