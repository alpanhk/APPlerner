"""Generate offline fallback clips for every A1 reading sentence.

Reads src/data/reading/*.json, keeps texts with level A1, synthesizes each unique
sentence with Piper, writes a1_text_*.wav, and merges normalized keys into
src/assets/tts_core/manifest.json. Existing clips are preserved.
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
READING = ROOT / "src" / "data" / "reading"
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
    sentences: list[str] = []
    for file in sorted(READING.glob("*.json")):
        data = json.loads(file.read_text(encoding="utf-8"))
        for text in data.get("texts", []):
            if text.get("level") != "A1":
                continue
            sentences.extend(sentence["de"] for sentence in text.get("sentences", []) if sentence.get("de"))
    unique = sorted(set(sentences))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    phrases = manifest.setdefault("phrases", {})

    needed: dict[str, str] = {}
    for index, sentence in enumerate(unique, 1):
        key = normalize_phrase(sentence)
        if key in phrases:
            continue
        filename = f"a1_text_{index:03d}.wav"
        if (OUT / filename).exists():
            phrases[key] = filename
            continue
        needed.setdefault(key, filename)

    generated = 0
    with tempfile.TemporaryDirectory(prefix="lernen-a1-text-tts-") as temp_name:
        temp = Path(temp_name)
        for key, filename in needed.items():
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
                raise SystemExit(proc.stderr or f"Piper gagal pada kalimat: {key}")
            shutil.copyfile(temp / filename, destination := OUT / filename)
            phrases[key] = filename
            generated += 1

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    missing = [name for name in needed.values() if not (OUT / name).exists()]
    if missing:
        raise SystemExit(f"Klip bacaan hilang: {missing[:5]}")
    print(f"Audio bacaan A1 siap: {len(unique)} kalimat unik, {generated} klip baru.")


if __name__ == "__main__":
    main()
